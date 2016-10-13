var StyleUtils = require('../../../src/widgets/auto-style/style-utils.js');

describe('src/widgets/auto-style/style-utils', function () {
  describe('.changeStyle', function () {
    it('should change style attribute', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad;}';
      var attr = 'marker-fill';
      var newStyle = 'marker-fill: blue;';

      var expected = '#layer { marker-fill: blue; marker-line-color: white;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style and remove duplicated', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; marker-fill: #fafafa;}';
      var attr = 'marker-fill';
      var newStyle = 'marker-fill: blue;';

      var expected = '#layer { marker-fill: blue; marker-line-color: white;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style, remove duplicated and remove empty braces', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; [me>gasol] { marker-fill: #fafafa; }}';
      var attr = 'marker-fill';
      var newStyle = 'marker-fill: blue;';

      var expected = '#layer { marker-fill: blue; marker-line-color: white;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style, remove duplicated and don\'t remove braces', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; [me>gasol] { marker-fill: #fafafa; marker-line-color: green; }}';
      var attr = 'marker-fill';
      var newStyle = 'marker-fill: blue;';

      var expected = '#layer { marker-fill: blue; marker-line-color: white; [me>gasol] { marker-line-color: green; }}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });
  });

  describe('.replaceWrongSpaceChar', function () {
    it('should has 12 wrong spaces', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill #adadad [me>gasol { marker-fill: #fafafa; marker-line-color: green; }}';
      expect(cartocss.match(new RegExp(String.fromCharCode(160), 'g')).length).toBe(12);
    });

    it('should has 0 wrong spaces', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill #adadad [me>gasol { marker-fill: #fafafa; marker-line-color: green; }}';
      expect(StyleUtils.replaceWrongSpaceChar(cartocss).match(new RegExp(String.fromCharCode(160), 'g'))).toBe(null);
    });
  });
});
