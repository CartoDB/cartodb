var StyleGenerator = require('../../../../../javascripts/cartodb3/editor/style/style-converter');
var FIXTURES = require('./style-converter-fixtures.spec');

function assertCartoCSS (a, b) {
  expect(a.replace(/ {2}/g, '')).toBe(b.replace(/ {2}/g, ''));
}
describe('editor/style/style-converter', function () {
  beforeEach(function () {});

  it('it should generate style', function () {
    for (var i = 0; i < FIXTURES.length; ++i) {
      if (FIXTURES[i].result.point) {
        var point = StyleGenerator.generateStyle(FIXTURES[i].style, 'point');
        assertCartoCSS(point.cartoCSS, FIXTURES[i].result.point.cartocss);
        if (FIXTURES[i].result.point.type) {
          expect(point.layerType).toBe(FIXTURES[i].result.point.type);
        }
        if (FIXTURES[i].result.point.sql) {
          expect(point.sql).toBe(FIXTURES[i].result.point.sql);
        }
      }
      if (FIXTURES[i].result.line) {
        var line = StyleGenerator.generateStyle(FIXTURES[i].style, 'line');
        assertCartoCSS(line.cartoCSS, FIXTURES[i].result.line.cartocss);
        if (FIXTURES[i].result.line.type) {
          expect(line.layerType).toBe(FIXTURES[i].result.line.type);
        }
      }
      if (FIXTURES[i].result.polygon) {
        var polygon = StyleGenerator.generateStyle(FIXTURES[i].style, 'polygon');
        assertCartoCSS(polygon.cartoCSS, FIXTURES[i].result.polygon.cartocss);
        if (FIXTURES[i].result.polygon.type) {
          expect(polygon.layerType).toBe(FIXTURES[i].result.polygon.type);
        }
      }
    }
  });
});
