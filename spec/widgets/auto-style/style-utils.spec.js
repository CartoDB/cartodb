var StyleUtils = require('../../../src/widgets/auto-style/style-utils.js');

describe('src/widgets/auto-style/style-utils', function () {
  describe('.changeStyle', function () {
    it('should change style attribute', function () {
      var cartocss = '#layer {marker-line-color: white; marker-fill: #adadad;}';
      var attr = 'marker-fill';
      var newStyle = ' marker-fill: blue;';

      var expected = '#layer {marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style and remove duplicated', function () {
      var cartocss = '#layer {marker-line-color: white; marker-fill: #adadad; marker-fill: #fafafa;}';
      var attr = 'marker-fill';
      var newStyle = ' marker-fill: blue;';

      var expected = '#layer {marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style, remove duplicated and remove empty braces', function () {
      var cartocss = '#layer {marker-line-color: white; marker-fill: #adadad; [me>gasol] { marker-fill: #fafafa; }}';
      var attr = 'marker-fill';
      var newStyle = ' marker-fill: blue;';

      var expected = '#layer {marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });
  });
});
