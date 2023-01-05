const dgram = require('dgram')
const configs = require("../config/config-manager");
const dbc = configs.getConfig('BROKER')

const PACKET_KEYS = {

}

class DisplayBroker {
  constructor() {
    
    this.display = null
    this.appBroker = null

    this.sockets = {
      toDisplay : dgram.createSocket('udp4'),
      fromDisplay : dgram.createSocket('udp4')
    }

    //for each packet type list of observers that will be sent each packet
    this.observers = []
  }


  addPacketObserver(observer){
    this.observers.push(observer)
  }
  
  packetRouter(message, from){
    // console.log(this) 
    for(let i=0; i < this.observers.length; i++){
      this.observers[i].messageHandler(message, from)
    }
  }

  initSockets(){
    // console.log("init sockets", this)
    this.sockets.fromDisplay.bind(dbc.controllerPort)
    // this.sockets.fromDisplay.on('message', (message, from)=>{this.packetRouter(message, from)})
    this.sockets.fromDisplay.on('message', this.packetRouter.bind(this))
  }

}

module.exports = {
  DisplayBroker
}
