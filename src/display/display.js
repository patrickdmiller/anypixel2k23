const configs = require("../config/config-manager");
const DC = configs.getConfig("DISPLAY");
const DCA = configs.getConfig("DISPLAY_ADDRESSING");
const { DisplayBroker } = require("./display-broker");
const { DisplayUnit, DisplayUnitEvents } = require("./display-unit");
const { PowerUnit, powerUnitEvents } = require("./power-unit");
const PacketBuilder = require("../packets/packet-builder");
const EventEmitter = require("events");
const DisplayEvents = {
  STATE_INPUT: "DISPLAY_STATE_INPUT",
  ONLINE_STATUS:"ONLINE_STATUS"
};
class Display extends EventEmitter {
  constructor() {
    super();
    this.displayUnits = [];
    this.displayUnitsByIP = {};
    this.powerUnits = [];
    this.powerUnitsByIP = {};
    let unitNumber = 0;
    this.displayBroker = new DisplayBroker();
    setInterval( ()=>{this.checkDisplayUnits()}, 1000)
    for (let i = 0; i < DCA.unitAddresses.length; i++) {
      for (let j = 0; j < DCA.unitAddresses[i].length; j++) {
        this.displayUnits[unitNumber] = new DisplayUnit({
          ipAddress: DCA.unitAddresses[i][j].ip,
          port: DCA.unitAddresses[i][j].port,
          unitNumber: unitNumber,
          broker: this.displayBroker,
          rowCol: DC.unitNumberToGlobalUnitRowCol(unitNumber),
        });
        let _unitNumber = unitNumber;

        this.displayUnits[unitNumber].on(DisplayUnitEvents["STATE"], (params) => {
          this.handleDisplayUnitState({
            unitNumber: _unitNumber,
            params: params,
          });
        });

        this.displayUnits[unitNumber].on(DisplayUnitEvents["STATUS"], (params) => {
          this.handleDisplayUnitStatus({
            unitNumber: _unitNumber,
            params: params,
          });
        });

        this.displayUnitsByIP[DCA.unitAddresses[i][j].ip] = unitNumber;
        unitNumber++;
      }
    }

    unitNumber = 0;
    for (let i = 0; i < DCA.powerUnitAddresses.length; i++) {
      this.powerUnits[unitNumber] = new PowerUnit({
        ipAddress: DCA.powerUnitAddresses[i].ip,
        port: DCA.powerUnitAddresses[i].port,
        unitNumber: unitNumber,
        broker: this.displayBroker,
      });
      this.powerUnits[unitNumber].on(powerUnitEvents["STATUS"], this.handlePowerUnitStatus.bind(this));
      this.powerUnitsByIP[DCA.powerUnitAddresses[i].ip] = unitNumber;
      unitNumber++;
    }

    this.displayBroker.addPacketObserver(this);
    this.displayBroker.initSockets();
  }
  checkDisplayUnits(){
  
    let good = 0
    for(const displayUnit of this.displayUnits){
      if(displayUnit.heartbeatStatus){
        good+=1
      }
    }
    
    this.emit(DisplayEvents['ONLINE_STATUS'], {good:good + '/' + this.displayUnits.length})
  }
  handleDisplayUnitState({ unitNumber, params } = {}) {
    let globalStateChanged = [];
    // //figure out global positions for each state change
    for (const buttonIndex of params) {
      globalStateChanged.push({
        globalRowCol: DC.unitPixelToRowCol(unitNumber, buttonIndex),
        state: this.displayUnits[unitNumber].getStateForInput(buttonIndex),
      });
    }
    this.emit(DisplayEvents["STATE_INPUT"], globalStateChanged);
  }
  handleDisplayUnitStatus({ unitNumber, params } = {}) {
    // console.log("from display nit status", params)
    this.displayUnits[unitNumber].pingHeartbeat()
  }
  handlePowerUnitStatus(...params) {
    this.emit(powerUnitEvents.STATUS, params[0].detail )
  }

  pixelMessageHandler(data) {
    var data8 = data.slice(1);
    var data8v = new Uint8Array(data8);
    // console.log(data8v)
    // Clear the RGB array for each unit
    this.displayUnits.forEach(function (unit) {
      unit.clearPixelArray();
    });

    // Assign each pixel to the right display unit
    for (var i = 0, l = data8v.length; i < l; ) {
      var pixelNumber = i / 3;
      this.displayUnits[DC.pixelToUnit(pixelNumber)].addPixel(
        data8v[i++],
        data8v[i++],
        data8v[i++]
      );
    }

    // Generate the pixel packets
    this.displayUnits.forEach(function (unit) {
      unit.savePixelPacket();
    });


    this.sendAllPixels()
  }

  sendAllPixels(){
    for(const unit of this.displayUnits){
      // console.log(unit.pixelBuffer)
      this.displayBroker.sendToDisplayUnit(unit.ip, unit.port, unit.pixelBuffer)
    }
    
  }

  //this is interface method for observer of display-broker
  displayMessageHandler(message, from) {
    //parse it
    let data_8 = message.slice(0);
    let data_8v = new Uint8Array(data_8);
    let displayUnitNumber = this.displayUnitsByIP[from.address];
    let powerUnitNumber = this.powerUnitsByIP[from.address];
    if (process.env.EMULATOR == "true") {
      displayUnitNumber = powerUnitNumber = data_8v[1];
    }

    switch (data_8v[0]) {
      case PacketBuilder.commandFlags.rx_inputState:
        //handleInputState
        this.displayUnits[displayUnitNumber].updateInputStates(data_8, PacketBuilder.rxHeaderLength);
        break;
      case PacketBuilder.commandFlags.rx_statusData:
        this.displayUnits[displayUnitNumber].updateStatus(data_8, PacketBuilder.rxHeaderLength);
        break;

      case PacketBuilder.commandFlags.rx_powerData:
        if (powerUnitNumber !== null) {
          this.powerUnits[powerUnitNumber].updateStatus(data_8, PacketBuilder.rxHeaderLength);
        }
        break;
    }
    // console.log("wall received message", message, "\nfrom:", from, displayUnitNumber, powerUnitNumber, "message type", );
  }
}

class Button {
  constructor() {
    this.state = 0;
  }
}

module.exports = {
  Display,
  DisplayUnit,
  Button,
  DisplayEvents,
};
