const path = require('path')
const configs = require("../config/config-manager");
const DisplayUnitInputPacket = require("../packets/display-unit-input-packet")
const { parse } = require('url');
const AppServerConfig = configs.getConfig("APPSERVER");
const EventEmitter = require("events");
const express = require("express");
const ws = require("ws")
const logger = require('node-color-log')
const {controlMessageGenerate, CONTROL_MESSAGE_KEYS} = require('./src/common')
const {APP_IDS} = require('../config/user-defined/constants')
const AppServerEvents = {
  'STATE':'APPSERVER_PIXEL_STATE'
}
class AppServer extends EventEmitter {
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
    this.wsPaths = {
      APP:'/app',
      CONTROL:'/control'
    }
    this.wsPathByValue = {}
    this.wsServers = {}
    this.sockets = {};
    this.currentState = {appID:null}
    for(const key in this.wsPaths){
      this.wsServers[key] = new ws.Server({ noServer: true , path: this.wsPaths[key]})
      this.sockets[key] = {}
      this.wsPathByValue[this.wsPaths[key]] = key
    }
    this.wsServers['APP'].binaryType = 'arraybuffer';
    this.app.get('/app-wrapper', (req, res)=>{
      res.render('app-wrapper')
    })
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
    this.server.listen(AppServerConfig.port);
    logger.info('app server on ',AppServerConfig.port )
    this.server.on("upgrade", (request, socket, head) => {
      const { pathname } = parse(request.url);
      if(pathname in this.wsPathByValue){
        let pathKey = this.wsPathByValue[pathname]
        logger.warn("pathKey", pathKey)
        this.wsServers[pathKey].handleUpgrade(request, socket, head, (socket) => {
          this.wsServers[pathKey].emit("connection", socket, request);
        });
      }else{
        logger.error("no path match", pathname, this.wsPathByValue)
      }
    });

    this.wsServers.APP.on("connection", (socket) => {
      logger.debug("app connected")
      this.sockets.APP[socket] = socket;
      socket.on("message", (packet) => {
        // message = parsePacket(packet);
        this.emit(AppServerEvents['STATE'], packet)
        // console.log(packet)
      });

      socket.on("close", () => {
        delete this.sockets.APP[socket];
      });
    });

    this.wsServers.CONTROL.on("connection", (socket) => {
      logger.debug("controller connected")
      this.sockets.CONTROL[socket] = socket;
      socket.on("message", (packet) => {
      
        try{
          let message = JSON.parse(packet.toString())
          // console.log("Message", message)
          switch(message.controlMessageKey){
            case CONTROL_MESSAGE_KEYS.GET_STATUS:
              this.changeApp(this.currentState.appID)
          }
        }catch(e){
          console.error(e)
        }
   
      });

      socket.on("close", () => {
        delete this.sockets.CONTROL[socket];
      });
    });
  }

  sendToSockets({message, pathKey='APP'}={}) {
    // console.log(this.sockets)
    // console.log(this.wsServers[pathKey].clients)
    for(const client of this.wsServers[pathKey].clients){
      // console.log(message)
      client.send(message)
    }

  }

  updateInputState(globalStateChanged){
    // logger.info('in app-broker: display input state', globalStateChanged)
    //build bytes
    const packetLength = DisplayUnitInputPacket.rxPacketLength * globalStateChanged.length + 1;
    let data_8 = new Buffer.alloc(packetLength)
    let data_8v = new Uint8Array(data_8.buffer)
    let currentByte = 0
    data_8v[currentByte++] = DisplayUnitInputPacket.rxHeader;
    // console.log(data_8v.length)
    for(const state of globalStateChanged){
      data_8v[currentByte++] = state.globalRowCol[0]
      data_8v[currentByte++] = state.globalRowCol[1]
      data_8v[currentByte++] = state.state
    }

    this.sendToSockets({message:data_8v, pathKey:'APP'})
  }

  changeApp(appID){
    if(appID in APP_IDS){
      this.currentState.appID = appID
      this.sendToSockets({message:controlMessageGenerate.changeApp(appID), pathKey:'CONTROL'})
    }else{
      console.error("invalid appid is sent", appID)
    }
  }

  reloadApp(){
    this.sendToSockets({message:controlMessageGenerate.reloadApp(), pathKey:'CONTROL'})
  }
}

module.exports = {
  AppServer,
  AppServerEvents
};
