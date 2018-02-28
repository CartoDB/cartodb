var LegendColors = require('builder/editor/layers/layer-content-views/legend/form/legend-color-range');

describe('editor/layers/layer-content-views/legends/form/legend-color-range', function () {
  var COLORS = [
    '#66B79E',
    '#E65176',
    '#528995',
    '#FF710F',
    '#305482',
    '#CCD859',
    '#565175',
    '#FFB927',
    '#3EBCAE',
    '#E54C1F'
  ];

  it('should rotate properly', function () {
    expect(LegendColors.getNextColor()).toBe(COLORS[1]);
    expect(LegendColors.getNextColor()).toBe(COLORS[2]);
    expect(LegendColors.getNextColor()).toBe(COLORS[3]);
    expect(LegendColors.getNextColor()).toBe(COLORS[4]);
    expect(LegendColors.getNextColor()).toBe(COLORS[5]);
    expect(LegendColors.getNextColor()).toBe(COLORS[6]);
    expect(LegendColors.getNextColor()).toBe(COLORS[7]);
    expect(LegendColors.getNextColor()).toBe(COLORS[8]);
    expect(LegendColors.getNextColor()).toBe(COLORS[9]);
    expect(LegendColors.getNextColor()).toBe(COLORS[0]);
    expect(LegendColors.getNextColor()).toBe(COLORS[1]);
  });
});
