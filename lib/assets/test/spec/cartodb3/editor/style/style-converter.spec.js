
var StyleGenerator = require('../../../../../javascripts/cartodb3/editor/style/style-converter');
var FIXTURES = require('./style-converter-fixtures.spec');

describe('editor/style/style-converter', function () {
  beforeEach(function () {
  });

  it ("it should generate style", function () {
    for (var i = 0; i < FIXTURES.length; ++i) {
      expect(StyleGenerator.generateStyle(FIXTURES[i].style, 'point').cartoCSS).toBe(FIXTURES[i].result.point.cartocss)
      if (FIXTURES[i].result.point.sql) {
        expect(StyleGenerator.generateStyle(FIXTURES[i].style, 'point').sql).toBe(FIXTURES[i].result.point.sql)
      }
      if (FIXTURES[i].result.line) {
        expect(StyleGenerator.generateStyle(FIXTURES[i].style, 'line').cartoCSS).toBe(FIXTURES[i].result.line.cartocss)
      }
      if (FIXTURES[i].result.polygon) {
        expect(StyleGenerator.generateStyle(FIXTURES[i].style, 'polygon').cartoCSS).toBe(FIXTURES[i].result.polygon.cartocss)
      }
    }
  });
});
