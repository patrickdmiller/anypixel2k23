/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const configs = require("../config/config-manager");
const DisplayConfig = configs.getConfig("DISPLAY");
const EventEmitter = require("events");
const PacketBuilder = require("../packets/packet-builder");

const CalibrationData = require("../calibration/calibration-data");
const DotCorrectionData = require("../calibration/dot-correction-data");
const DisplayUnitInputPacket = require("../packets/display-unit-input-packet");
const DisplayUnitStatusPacket = require("../packets/display-unit-status-packet");

const UPTIME_ALERT_TIMEOUT = 10000;
function dec2bin(dec) {
  return (dec >>> 0).toString(2);
}

/**
 * Class which manages the status and communication for a single display unit.
 *
 * The UI for this class is provided by ui/display-unit-modal.js and ui/display-unit-list.js
 */

const DisplayUnitEvents = {
  STATUS: "DISPLAY_UNIT_STATUS",
  STATE:"DISPLAY_UNIT_STATE"
};

class DisplayUnit extends EventEmitter {

  constructor({ ipAddress, port, unitNumber, broker }) {
    super();
    this.ipAddress = ipAddress;
    this.port = port;
    this.unitNumber = unitNumber;
    this.RGBArray = null;
    this.row = null;
    this.col = null;
    this.inputStates = [];
    this.inputStatesBuffer = Buffer.alloc(Math.ceil(DisplayConfig.pixelsPerUnit/8))
    this.inputStates8bitView = new Uint8Array(this.inputStatesBuffer.buffer) //this uses the same memory as the buffer
    this.pixelBuffer = null;
    this.healthStatuses = [];
    this.lastUptimes = [];
    this.broker = broker
    // Initialize input state array with zeros
    for (var i = 0; i < DisplayConfig.pixelsPerUnit; i++) {
      this.inputStates.push(0);
    }

    // Initialize the healthy status array with false
    for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
      this.healthStatuses.push(false);
    }

    // Initialize the last uptimes array with zeros
    for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
      this.lastUptimes.push(0);
    }
  }

  getStateForInput(inputIndex){
    let byteIndex = Math.floor(inputIndex/8)
    let shifts = inputIndex - (8 * byteIndex)
    return ((1<<(8-shifts-1)) & this.inputStates8bitView[byteIndex]) > 0 ? 1 : 0
  }
  /**
   * Parse input state update packets and notify the current app of any state changes
   */
  updateInputStates(buffer, headerLength) {
    if(buffer.length - headerLength != this.inputStatesBuffer.length){
      console.warn("invalid buffer length for input")
      return;
    }
    let payload = buffer.slice(headerLength)
    let payloadIndex = headerLength
 
    let changed = []
    if(this.inputStatesBuffer.compare(payload) == 0){
      //this should theoretically never happen as boards only send on change. 

    }else{
      //find changed bytes
      const payload8bitView = new Uint8Array(payload.buffer)      
      
      for(let i = 0; i < this.inputStates8bitView.length; i++){
        if(payload8bitView[i+payloadIndex] == this.inputStates8bitView[i]){
          continue
        }
        for(let b = 0; b < 8; b++){
          if(((1 << b)&payload8bitView[i+payloadIndex] )!=((1 << b)& this.inputStates8bitView[i])){
            changed.push((i*8)+7-b)
            this.inputStates8bitView[i] = payload8bitView[i+payloadIndex]
          }
        }
      }
    }
    //fire the event
    this.emit(DisplayUnitEvents['STATE'],changed)
    return
    var full_packet = new Uint8Array(buffer);
    var packet = full_packet.slice(headerLength, full_packet.length);
    

    var changedInputs = DisplayUnitInputPacket.parse(packet, this.inputStates);
    console.log(changedInputs)
    if (changedInputs.length) {
      var packetLength = DisplayUnitInputPacket.rxPacketLength * changedInputs.length + 1;
      var data_8 = new ArrayBuffer(packetLength);
      var data_8v = new Uint8Array(data_8);
      var currentByte = 0;

      data_8v[currentByte++] = DisplayUnitInputPacket.rxHeader;

      // Get pixel location for each changed input
      for (var i = 0; i < changedInputs.length; i++) {
        var position = DisplayConfig.unitPixelToRowCol(this.unitNumber, changedInputs[i].index);
        data_8v[currentByte++] = position[0];
        data_8v[currentByte++] = position[1];
        data_8v[currentByte++] = changedInputs[i].state;
      }
      console.log(data_8v)
      //TODO fire button states
      // require("./app-controller").sendMessage(data_8);
    }
  }

  /**
   * Parse a display unit status packet and notify the display controller of a status change
   */
  updateStatus = function (buffer, headerLength) {
    // Drop header
    var full_packet = new Uint8Array(buffer);
    var packet = full_packet.slice(headerLength, full_packet.length);
    var status = DisplayUnitStatusPacket.parse(packet, this.unitNumber);

    // Create status update event
    var statusUpdateEvent = new CustomEvent(DisplayUnit.statusUpdateEvent, {
      detail: {
        unitNumber: this.unitNumber,
        status: status,
      },
    });

    status.uptime.forEach(function (t, i) {
      this.healthStatuses[i] = t - this.lastUptimes[i] < UPTIME_ALERT_TIMEOUT;
      this.lastUptimes[i] = t;
    }, this);

    // Dispatch status update event
    document.dispatchEvent(statusUpdateEvent);
  };

  /**
   * Returns true if all display boards are healthy
   */
  isHealthy = function () {
    for (var i = 0; i < this.healthStatuses.length; i++) {
      if (!this.healthStatuses[i]) {
        return false;
      }
    }
    return true;
  };

  /**
   * Clears the pixel arrays
   */
  clearPixelArray = function () {
    this.RGBArray = [];
    this.RGBArrayPacked = [];
  };

  /**
   * Adds a given color to the pixel array
   */
  addPixel = function (r, g, b) {
    this.RGBArray.push(r);
    this.RGBArray.push(g);
    this.RGBArray.push(b);
  };

  /**
   * Creates and saves a packet containing the pixel data from the current frame
   */
  savePixelPacket = function () {
    this.RGBArrayPacked = this.RGBArray;

    // Create pixel data buffer
    var data_8 = new ArrayBuffer(this.RGBArrayPacked.length);
    var data_8v = new Uint8Array(data_8);

    // Add the pixels
    for (var i = 0; i < this.RGBArrayPacked.length; i++) {
      data_8v[i] = this.RGBArrayPacked[i];
    }

    // Build the packet
    var packet = PacketBuilder.buildTxPacket({
      commandFlag: PacketBuilder.commandFlags.tx_8BitColor,
      unitNumber: this.unitNumber,
      sequenceNumber: 0,
      ipAddress: this.ipAddress,
      port: this.port,
      payload: data_8,
    });

    // Save the packet
    this.pixelBuffer = packet;
  };

  /**
   * Sets the given dot correction values. Returns a promise which resolves when the data is sent.
   *
   * See /calibration/dot-correction-data.js for more info about dot correction.
   */
  setDotCorrection = function (r, g, b) {
    return new Promise(
      function (resolve, reject) {
        var packet = PacketBuilder.buildTxPacket({
          commandFlag: PacketBuilder.commandFlags.tx_8BitDotCorrection,
          unitNumber: this.unitNumber,
          sequenceNumber: 0,
          ipAddress: this.ipAddress,
          port: this.port,
          payload: DotCorrectionData.buildPayloadFromData(r, g, b),
        });

        this.sendMessage(packet);

        setTimeout(
          function () {
            resolve();
          }.bind(this),
          100
        );
      }.bind(this)
    );
  };

  /**
   * Sets the calibration data for this display unit. Returns a promise which resolves when all the
   * calibration data packets have been sent. Each calibration table index is sent out sequentially,
   * with a short delay between each one.
   */
  setCalibration = function (calibration) {
    var perPacketDelayMs = 33;

    // Returns a promise which resolves after a given amount of time in milliseconds
    function delay(ms) {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, ms);
      });
    }

    function sendCalibration() {
      var promises = [];
      for (var i = 0; i < calibration.length; i++) {
        var tableData = calibration[i];
        promises.push(
          new Promise(
            function (resolve, reject) {
              // Create the packet
              var packet = PacketBuilder.buildTxPacket({
                commandFlag: PacketBuilder.commandFlags.tx_12BitCalLookup,
                unitNumber: this.unitNumber,
                sequenceNumber: 0,
                ipAddress: this.ipAddress,
                port: this.port,
                tableEntry: i,
                payload: CalibrationData.buildPayloadFromData(tableData),
              });

              // Send with a small delay
              delay(i * perPacketDelayMs).then(
                function () {
                  this.sendMessage(packet);
                  resolve();
                }.bind(this)
              );
            }.bind(this)
          )
        );
      }
      return Promise.all(promises);
    }

    return new Promise(
      function (resolve, reject) {
        sendCalibration.call(this).then(
          function () {
            setTimeout(function () {
              resolve();
            }, perPacketDelayMs);
          }.bind(this)
        );
      }.bind(this)
    );
  };

  /**
   * Transmits a given data packet to the unit's ip address uver UDP
   */
  sendMessage = function (data) {
    if (DisplayController.socketId) {
      chrome.sockets.udp.send(DisplayController.socketId, data, this.ipAddress, this.port, function (result) {
        if (chrome.runtime.lastError) {
          /* Ignore */
        }
      });
    }
  };
}

module.exports = {
  DisplayUnit,
  DisplayUnitEvents
}