class PixelMappingUtils {
  constructor({
    wallLayoutConfig=require('../../config/config.display')
  }){
    this.wallLayoutConfig = wallLayoutConfig
  }
  pixelToUnit = function (px) {
    const wc = this.wallLayoutConfig;
    let matchRow = Math.floor(px / wc.cols);
    let matchCol = px % wc.cols;
    let unitCol = Math.floor(matchCol / (wc.boardsPerUnitCols * wc.boardCols));
    let unitRow = Math.floor(matchRow / (wc.boardsPerUnitRows * wc.boardRows));
    return unitRow * wc.unitCols + unitCol;
  };

  unitPixelToRowCol = function (unitNumber, pixelNumber) {
    const wc = this.wallLayoutConfig;
    let unitRow = Math.floor(unitNumber / wc.unitCols);
    let unitCol = unitNumber - unitRow * wc.unitCols;
    let pixelRow = Math.floor(pixelNumber / (wc.boardCols * wc.boardsPerUnitCols));
    let pixelCol = pixelNumber - pixelRow * (wc.boardCols * wc.boardsPerUnitCols);

    let overallRow = unitRow * (wc.boardsPerUnitRows * wc.boardRows) + pixelRow;
    let overallCol = unitCol * (wc.boardsPerUnitCols * wc.boardCols) + pixelCol;
    return [overallRow, overallCol];
  };

  unitNumberToGlobalUnitRowCol = function (unitNumber) {
    const wc = this.wallLayoutConfig;
    let col = unitNumber % wc.unitCols;
    let row = Math.floor(unitNumber / wc.unitCols);
    return [row, col];
  };

  rowColToUnitNumber = function (row, col) {
    const wc = this.wallLayoutConfig;
    return col + row * wc.unitCols;
  };
}

module.exports = PixelMappingUtils