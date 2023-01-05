const configs = require("../config/config-manager");
const DC = configs.getConfig("DISPLAY");
const DCA = configs.getConfig("DISPLAY_ADDRESSING");

const { DisplayBroker } = require("./display-broker");
class Display {
  constructor() {
    this.displayUnits = [];
    this.displayUnitsByIP = {};
    this.powerUnits = [];
    this.powerUnitsByIP = {};
    let unitNumber = 0;
    for (let i = 0; i < DCA.unitAddresses.length; i++) {
      for (let j = 0; j < DCA.unitAddresses[i].length; j++) {
        this.displayUnits[unitNumber] = new DisplayUnit({
          ip: DCA.unitAddresses[i].ip,
          port: DCA.unitAddresses[i].port,
          unitNumber: unitNumber,
          rowCol: DC.unitNumberToGlobalUnitRowCol(unitNumber),
        });
        this.displayUnitsByIP[DCA.unitAddresses[i].ip] = unitNumber;
        unitNumber++;
      }
    }

    unitNumber = 0;
    for (let i = 0; i < DCA.powerUnitAddresses.length; i++) {
      for (let j = 0; j < DCA.powerUnitAddresses[i].length; j++) {
        this.powerUnits[unitNumber] = new PowerUnit({
          ip: DCA.powerUnitAddresses[i].ip,
          port: DCA.powerUnitAddresses[i].port,
          unitNumber: unitNumber,
        });
        this.powerUnitsByIP[DCA.powerUnitAddresses[i].ip] = unitNumber;
        unitNumber++;
      }
    }
    console.log(this.powerUnitsByIP)
    this.displayBroker = new DisplayBroker();
  }

  initBroker() {
    this.displayBroker.addPacketObserver(this);
    this.displayBroker.initSockets();
  }

  messageHandler(message, from) {
    //parse it
    let data_8 = message.slice(0);
    let data_8v = new Uint8Array(data_8);
    let displayUnitNumber = this.displayUnitsByIP[from.address];
    let powerUnitNumber = this.powerUnitsByIP[from.address];
    if (process.env.EMULATOR == "true") {
      displayUnitNumber = powerUnitNumber = data_8v[1];
  
    }
    console.log("wall received message", message, "\nfrom:", from, displayUnitNumber, powerUnitNumber);

  }
}

class DisplayUnit {
  constructor({ ip, port, unitNumber, rowCol } = {}) {
    this.ip = ip;
    this.port = port;
    this.unitNumber = unitNumber;
    this.rowCol = rowCol;
  }
}

class PowerUnit {}

class Button {
  constructor() {
    this.state = 0;
  }
}

module.exports = {
  Display,
  DisplayUnit,
  Button,
};
