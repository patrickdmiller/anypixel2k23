const DEFAULT_WALL_ADDRESS_CONFIG = require("../config/config.emulator.js");
const DEFAULT_WALL_LAYOUT_CONFIG = require("../config/config.display.js");
const DEFAULT_POWER_CONFIG = require("../config/config.power.js");
const PixelMappingUtils = require("../utils/mappings/pixel-mapping-utils");

const configs = require('../config/config-manager')

console.log("getting config for POWER", configs.getConfig('POWER'))


class Wall {
  constructor({
    wallAddressConfig = DEFAULT_WALL_ADDRESS_CONFIG,
    powerConfig = DEFAULT_POWER_CONFIG,
    wallLayoutConfig = DEFAULT_WALL_LAYOUT_CONFIG,
  } = {}) {
    this.wallAddressConfig = wallAddressConfig;
    this.powerConfig = powerConfig;
    this.wallLayoutConfig = wallLayoutConfig;
    this.pmu = new PixelMappingUtils({ wallLayoutConfig });

    this.wallUnits = [];
    this.wallUnitsIPMap = {};

    let unitNumber = 0;
    for (let i = 0; i < this.wallAddressConfig.unitAddresses.length; i++) {
      for (let j = 0; j < this.wallAddressConfig.unitAddresses[i].length; j++) {
        this.wallUnits[unitNumber] = new WallUnit({
          ip: this.wallAddressConfig.unitAddresses[i].ip,
          port: this.wallAddressConfig.unitAddresses[i].port,
          unitNumber: unitNumber,
          rowCol: this.pmu.unitNumberToGlobalUnitRowCol(unitNumber),
        });
        unitNumber++;
      }
    }
  }

  messageHandler(message, from){
    console.log("wall received message", message, "\nfrom:", from)
  }


}

class WallUnit {
  constructor({ ip, port, unitNumber, rowCol } = {}) {
    this.ip = ip;
    this.port = port;
    this.unitNumber = unitNumber;
    this.rowCol = rowCol;
  }
}

class PowerUnit {

}

class Button {
  constructor(){
    this.state = 0
  }
}

module.exports = Wall;
