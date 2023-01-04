const dgram = require('dgram')
const DEFAULT_WALL_BROKER_CONFIG = require("../config/config.udp");

module.exports = class WallBroker {
  constructor({ wall, wallBrokerConfig = DEFAULT_WALL_BROKER_CONFIG } = {}) {
    if (wall === null) {
      throw new Error("no wall object passed");
    }
    this.wall = wall
    this.wallBrokerConfig = wallBrokerConfig
    this.sockets = {
      toWall : dgram.createSocket('udp4'),
      fromWall : dgram.createSocket('udp4')
    }
  }

  packetParser(){
    //what kind of 
  }

  initSockets(){
    this.sockets.fromWall.bind(this.wallBrokerConfig.controllerPort)
    this.sockets.fromWall.on('message', this.wall.messageHandler)
  }


};
