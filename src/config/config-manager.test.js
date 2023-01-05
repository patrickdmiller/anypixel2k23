describe("config-manager test", () => {
  const configs = require("./config-manager");
  // configs.setConfigToDefault();

  test("Test DISPLAY config", () => {
    let display = configs.getConfig("DISPLAY");
    expect(display.boardCols).toBe(7);
    expect(display.boardRows).toBe(7);
    expect(display.boardsPerUnitCols).toBe(2);
    expect(display.boardsPerUnitRows).toBe(2);
    expect(display.unitRows).toBe(3);
    expect(display.unitCols).toBe(10);
    expect(display.cols).toBe(140);
    expect(display.rows).toBe(42);
    expect(display.pixelToUnit(0)).toBe(0);
    expect(display.pixelToUnit(1)).toBe(0);
    expect(display.pixelToUnit(14)).toBe(1);
    expect(display.pixelToUnit(140)).toBe(0);
    expect(display.pixelToUnit(5879)).toBe(29);
    expect(display.unitPixelToRowCol(0, 0)).toEqual([0, 0]);
    expect(display.unitPixelToRowCol(1, 0)).toEqual([0, 14]);
    expect(display.unitPixelToRowCol(9, 0)).toEqual([0, 126]);
    expect(display.unitPixelToRowCol(10, 1)).toEqual([14, 1]);
  });

  test("Test POWER config", () => {
    let power = configs.getConfig("POWER");
    expect(power.numPowerUnits).toBe(5);
  });
});
