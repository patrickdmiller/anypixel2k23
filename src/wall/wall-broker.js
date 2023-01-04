const dgram = require('dgram')
const DEFAULT_WALL_BROKER_CONFIG = require("../config/config.udp");

const PACKET_ROUTERS = {
  '__type__':'__function__',

}


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

  packetRouter(message, from){
    //what kind of packet is it? 
    
  }

  initSockets(){
    this.sockets.fromWall.bind(this.wallBrokerConfig.controllerPort)
    // this.sockets.fromWall.on('message', this.wall.messageHandler)
    this.sockets.fromWall.on('message', this.packetRouter)
  }


};
