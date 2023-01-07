const dgram = require('dgram')
const configs = require("../config/config-manager");
const dbc = configs.getConfig('BROKER')

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
      //message is Buffer, so pass the Buffer.buffer which is the raw arraybuffer
      this.observers[i].messageHandler(message.buffer, from)
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
