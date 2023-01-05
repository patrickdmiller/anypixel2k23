module.exports = (configs, thisConfigObject) => {
  /**
   * Number of units powered by a single power unit
   */
  thisConfigObject.unitsPerPowerUnit = thisConfigObject.unitRowsPerPowerUnit * thisConfigObject.unitColsPerPowerUnit;

  /**
   * Number of DC outputs in a single power unit
   */
  thisConfigObject.dcOutputsPerUnit = thisConfigObject.unitColsPerPowerUnit * thisConfigObject.dcOutputsPerSupply;

  /**
   * Number of AC inputs in a single power unit
   */
  thisConfigObject.acInputsPerUnit = thisConfigObject.acInputsPerSupply * thisConfigObject.unitColsPerPowerUnit;

  /**
   * Number of control relays in a single power unit
   */
  thisConfigObject.controlRelaysPerUnit =
    thisConfigObject.controlRelaysPerSupply * thisConfigObject.unitColsPerPowerUnit;

  /**
   * Total number of power units in the display
   */
  thisConfigObject.numPowerUnits = configs.DISPLAY.configObject.numUnits / thisConfigObject.unitsPerPowerUnit;

  /**
   * Returns the power unit number which powers the unit in a given row and column
   */
  thisConfigObject.unitRowColToUnitNumber = function (row, col) {
    return Math.floor(col / thisConfigObject.unitColsPerPowerUnit);
  };

  /**
   * Returns the relay column number that belongs to a given unit column
   */
  thisConfigObject.unitColToRelayCol = function (col) {
    return col % thisConfigObject.unitColsPerPowerUnit;
  };
};
