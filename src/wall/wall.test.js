const Wall = require("./wall");
describe("wall.js test", () => {
  let wall = new Wall({
    wallLayoutConfig : require('../config/config.display')
  });

  test("sanity check config", () => {
    expect(wall.wallLayoutConfig.boardCols).toBe(7);
    expect(wall.wallLayoutConfig.boardRows).toBe(7);
    expect(wall.wallLayoutConfig.boardsPerUnitCols).toBe(2)
    expect(wall.wallLayoutConfig.boardsPerUnitRows).toBe(2)
    expect(wall.wallLayoutConfig.unitRows).toBe(3)
    expect(wall.wallLayoutConfig.unitCols).toBe(10)
  });

  test("computed pixel counts", ()=>{
    expect(wall.wallLayoutConfig.cols).toBe(140)
    expect(wall.wallLayoutConfig.rows).toBe(42)
  })

  test("get unit from pixel", ()=>{
    expect(wall.pmu.pixelToUnit(0)).toBe(0)
    expect(wall.pmu.pixelToUnit(1)).toBe(0)
    expect(wall.pmu.pixelToUnit(14)).toBe(1)
    expect(wall.pmu.pixelToUnit(140)).toBe(0)
    expect(wall.pmu.pixelToUnit(5879)).toBe(29)
  })

  test("get global row col from unit's pixel", ()=>{
    expect(wall.pmu.unitPixelToRowCol(0, 0)).toEqual([0,0])
    expect(wall.pmu.unitPixelToRowCol(1, 0)).toEqual([0,14])
    expect(wall.pmu.unitPixelToRowCol(9, 0)).toEqual([0,126])
    expect(wall.pmu.unitPixelToRowCol(10, 1)).toEqual([14,1])
  })
});
