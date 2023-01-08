const DisplayUnitInputPacket = require("../packets/display-unit-input-packet")
const logger = require('node-color-log');

class AppBroker {
  constructor({ webserver }) {
    if (!webserver) {
      throw new Error("a webserver instance is required");
    }
    this.webserver = webserver;
  }

  //messages for front end

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
  AppBroker,
};
