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
    // console.log("message length: ",  message.length)
    for(let i=0; i < this.observers.length; i++){
      //message is Buffer, so pass the Buffer.buffer which is the raw arraybuffer
      this.observers[i].displayMessageHandler(message.buffer, from)
    }
  }

  initSockets(){
    // console.log("init sockets", this)
    this.sockets.fromDisplay.bind(dbc.controllerPort)
    // this.sockets.fromDisplay.on('message', (message, from)=>{this.packetRouter(message, from)})
    this.sockets.fromDisplay.on('message', this.packetRouter.bind(this))
  }

  sendToDisplayUnit(ip, port, data){
    let data8v = new Uint8Array(data)
    // console.log(data)
    this.sockets.toDisplay.send(data8v, 0, data8v.length, port, ip)
  }

}

module.exports = {
  DisplayBroker
}
