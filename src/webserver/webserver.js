const path = require('path')
const configs = require("../config/config-manager");
const WebserverConfig = configs.getConfig("WEBSERVER");
const EventEmitter = require("events");
const express = require("express");
const ws = require("ws")
const logger = require('node-color-log')

class Webserver extends EventEmitter {
  constructor() {
    super()
    this.app = require("express")();
    this.ws = require("ws");
    this.app.use(express.static(path.join(__dirname,  "public")));
    this.app.set("view engine", "html");
    this.app.engine("html", require("ejs").renderFile);
    this.server = require("http").Server(this.app);
    this.wsServer = new ws.Server({ noServer: true });
    this.wsServer.binaryType = 'arraybuffer';
    this.sockets = {};
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
}

module.exports = {
  Webserver,
};
