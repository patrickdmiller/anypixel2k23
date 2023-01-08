const path = require('path')
const configs = require("../config/config-manager");
const DisplayUnitInputPacket = require("../packets/display-unit-input-packet")

const WebserverConfig = configs.getConfig("WEBSERVER");
const EventEmitter = require("events");
const express = require("express");
const ws = require("ws")
const logger = require('node-color-log')
const WebserverEvents = {
  'STATE':'WEBSERVER_PIXEL_STATE'
}
class Webserver extends EventEmitter {
  constructor() {
    super()
    this.app = require("express")();
    this.ws = require("ws");
    this.app.use(express.static(path.join(__dirname,  "public")));
    // this.app.set("view engine", "html");
    this.app.set('views', path.join(__dirname,  "views"));

    this.app.set('view engine', 'ejs');
    // this.app.engine("html", require("ejs").renderFile);
    this.server = require("http").Server(this.app);
    this.wsServer = new ws.Server({ noServer: true });
    this.wsServer.binaryType = 'arraybuffer';
    this.sockets = {};


    this.app.get('/app/:app_name', function(req, res) {
      // Check if app exists
      var dir_name = req.params.app_name;
      var filename = path.join(__dirname, 'public', 'apps', dir_name, 'index.js');
      if (!fs.existsSync(filename)) {
        console.log('Invalid app name: ' + dir_name);
        return res.status(404).send('Invalid app name');
      }
    
      console.log('Serving: ' + req.params.app_name);
    
      // Render
      res.render('app', {
        layout: false,
        app: {
          name: req.params.app_name,
          base: '/apps/' + dir_name + '/',
          path: 'index.js'
        }
      });
    });


  }

  init() {
    this.server.listen(WebserverConfig.port);
    logger.info('app server on ',WebserverConfig.port )
    this.server.on("upgrade", (request, socket, head) => {
      this.wsServer.handleUpgrade(request, socket, head, (socket) => {
        this.wsServer.emit("connection", socket, request);
      });
    });

    this.wsServer.on("connection", (socket) => {
      this.sockets[socket] = socket;
      socket.on("message", (packet) => {
        // message = parsePacket(packet);
        this.emit(WebserverEvents['STATE'], packet)
        // console.log(packet)
      });

      socket.on("close", () => {
        delete this.sockets[socket];
      });
    });
  }

  sendToSockets(message) {
    // console.log(this.sockets)
    for (const key in this.sockets) {
      try {
        this.sockets[key].send(message);
      } catch (e) {}
    }
  }

  updateInputState(globalStateChanged){
    logger.info('in app-broker: display input state', globalStateChanged)
    //build bytes
    const packetLength = DisplayUnitInputPacket.rxPacketLength * globalStateChanged.length + 1;
    let data_8 = new Buffer.alloc(packetLength)
    let data_8v = new Uint8Array(data_8.buffer)
    let currentByte = 0
    data_8v[currentByte++] = DisplayUnitInputPacket.rxHeader;
    console.log(data_8v.length)
    for(const state of globalStateChanged){
      data_8v[currentByte++] = state.globalRowCol[0]
      data_8v[currentByte++] = state.globalRowCol[1]
      data_8v[currentByte++] = state.state
    }

    this.sendToSockets(data_8v)
  }
}

module.exports = {
  Webserver,
  WebserverEvents
};
