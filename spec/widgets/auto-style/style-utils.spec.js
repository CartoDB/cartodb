var StyleUtils = require('../../../src/widgets/auto-style/style-utils.js');

describe('src/widgets/auto-style/style-utils', function () {
  describe('.changeStyle', function () {
    it('should change style attribute', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad;}';
      var attr = 'marker-fill';
      var newStyle = 'blue';

      var expected = '#layer { marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style and remove duplicated', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; marker-fill: #fafafa;}';
      var attr = 'marker-fill';
      var newStyle = 'blue';

      var expected = '#layer { marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should understand @ variables', function () {
      var cartocss = '@red: red; #layer { marker-line-color: white; marker-fill: #adadad; marker-fill: @red;}';
      var attr = 'marker-fill';
      var newStyle = 'yellow';

      var expected = '@red: red; #layer { marker-line-color: white; marker-fill: yellow;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should remove inline comments', function () {
      var cartocss = '// paco \r /* hello */ \r #layer { marker-line-color: white; marker-fill: #adadad; marker-fill: #fafafa;}';
      var attr = 'marker-fill';
      var newStyle = 'blue';

      var expected = '/* hello */ \r #layer { marker-line-color: white; marker-fill: blue;}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style, remove duplicated and remove styles under conditional symbolizers', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; [me>gasol] { marker-fill: #fafafa; }}';
      var attr = 'marker-fill';
      var newStyle = 'blue';

      var expected = '#layer { marker-line-color: white; marker-fill: blue; [me>gasol] { }}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should change style, remove duplicated and don\'t remove braces', function () {
      var cartocss = '#layer { marker-line-color: white; marker-fill: #adadad; [me>gasol] { marker-fill: #fafafa; marker-line-color: green; }}';
      var attr = 'marker-fill';
      var newStyle = 'blue';

      var expected = '#layer { marker-line-color: white; marker-fill: blue; [me>gasol] { marker-line-color: green; }}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should not replace line-color if it is included under an outline symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; line-color: red; polygon-opacity: 0.1; ::outline { line-width: 0.5; line-color: green; }}';
      var attr = 'line-color';
      var newStyle = 'blue';

      var expected = '#layer { polygon-fill: white; line-color: blue; polygon-opacity: 0.1; ::outline { line-width: 0.5; line-color: green; }}';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should not replace line-color if it is included under a layer::outline symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; line-color: red; polygon-opacity: 0.1; } #layer::outline { line-width: 0.5; line-color: green; }';
      var attr = 'line-color';
      var newStyle = 'blue';

      var expected = '#layer { polygon-fill: white; line-color: blue; polygon-opacity: 0.1; } #layer::outline { line-width: 0.5; line-color: green; }';

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(expected);
    });

    it('should not replace line-opacity if it is included under an outline symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; polygon-opacity: 0.1; ::outline { line-width: 0.5; line-opacity: 0.7; }}';
      var attr = 'line-opacity';
      var newStyle = 0.2;

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(cartocss);
    });

    it('should not replace line-opacity if it is included under a layer::outline symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; polygon-opacity: 0.1; } #layer::outline { line-width: 0.5; line-opacity: 0.7; }';
      var attr = 'line-opacity';
      var newStyle = 0.2;

      expect(StyleUtils.changeStyle(cartocss, attr, newStyle)).toBe(cartocss);
    });

    it('should not replace the style if it\'s undefined', function () {
      var cartocss = '#layer { polygon-fill: white; polygon-opacity: 0.1; }';
      var attr = 'polygon-opacity';

      expect(StyleUtils.changeStyle(cartocss, attr, undefined)).toBe(cartocss);
    });
  });

  describe('.isPropertyIncluded', function () {
    it('should not consider a property is included if it is under a conditional symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; polygon-opacity: 0.1; [column_name > 0] { line-width: 0.5; line-color: green; }}';
      var attr = 'line-color';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(false);
    });

    it('should be included if attribute is not under a conditional symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; line-color: red; polygon-opacity: 0.1; }';
      var attr = 'line-color';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(true);
    });

    it('should be included if attribute is under a standard symbolizer', function () {
      var cartocss = '#layer { polygon-fill: white; polygon-opacity: 0.1; ::outline { line-width: 0.5; line-color: green; }}';
      var attr = 'line-color';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(true);
    });

    it('should be included if attribute is under a mapnik::geometry_type conditional symbolizer', function () {
      var cartocss = '#layer { polygon-opacity: 0.1; [mapnik::geometry_type="1"] { polygon-fill: white; }}';
      var attr = 'polygon-fill';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(true);
    });

    it('should work with @ variables', function () {
      var cartocss = '@red: red; #layer { polygon-opacity: 0.1; [mapnik::geometry_type="1"] { polygon-fill: @red; }}';
      var attr = 'polygon-fill';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(true);
    });

    it('should work with inline comments', function () {
      var cartocss = '// paco \r /* hello */ \r #layer { marker-line-color: white; marker-fill: #adadad; marker-fill: #fafafa;}';
      var attr = 'marker-fill';
      expect(StyleUtils.isPropertyIncluded(cartocss, attr)).toBe(true);
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
