//configs.DISPLAY.configObject assumes config for display is loaded into current object. (configs.DISPLAY.configObject.cols for example)
module.exports = (configs, thisConfigObject) => {
  thisConfigObject.pixelToUnit = function (px) {
    let matchRow = Math.floor(px / thisConfigObject.cols);
    let matchCol = px % thisConfigObject.cols;
    let unitCol = Math.floor(matchCol / (thisConfigObject.boardsPerUnitCols * thisConfigObject.boardCols));
    let unitRow = Math.floor(matchRow / (thisConfigObject.boardsPerUnitRows * thisConfigObject.boardRows));
    return unitRow * thisConfigObject.unitCols + unitCol;
  };

  thisConfigObject.unitPixelToRowCol = function (unitNumber, pixelNumber) {
    let unitRow = Math.floor(unitNumber / thisConfigObject.unitCols);
    let unitCol = unitNumber - unitRow * thisConfigObject.unitCols;
    let pixelRow = Math.floor(pixelNumber / (thisConfigObject.boardCols * thisConfigObject.boardsPerUnitCols));
    let pixelCol = pixelNumber - pixelRow * (thisConfigObject.boardCols * thisConfigObject.boardsPerUnitCols);

    let overallRow = unitRow * (thisConfigObject.boardsPerUnitRows * thisConfigObject.boardRows) + pixelRow;
    let overallCol = unitCol * (thisConfigObject.boardsPerUnitCols * thisConfigObject.boardCols) + pixelCol;
    return [overallRow, overallCol];
  };

  thisConfigObject.unitNumberToGlobalUnitRowCol = function (unitNumber) {
    let col = unitNumber % thisConfigObject.unitCols;
    let row = Math.floor(unitNumber / thisConfigObject.unitCols);
    return [row, col];
  };

  thisConfigObject.rowColToUnitNumber = function (row, col) {
    return col + row * thisConfigObject.unitCols;
  };
};
