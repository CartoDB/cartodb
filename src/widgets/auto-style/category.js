var AutoStyler = require('./auto-styler');
var CategoryAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var startingStyle = this.layer.get('meta').cartocss;
    var originalWidth = startingStyle.match(/marker-width:.*ramp.*;/g).replace('marker-width:', '');
    var style = '';
    var defColor = this.colors.getColorByCategory('Other');
    var stylesByGeometry = this.STYLE_TEMPLATE;
    var geometryType = this.layer.getGeometryType();
    if (geometryType) {
      var ramp = this._generateCategoryRamp(geometryType);
      style = stylesByGeometry[geometryType]
        .replace('{{ramp}}', ramp)
        .replace('{{layername}}', '#layer{');
    } else {
      for (var symbol in stylesByGeometry) {
        style += stylesByGeometry[symbol]
          .replace('{{layername}}', this._getLayerHeader(symbol))
          .replace('{{ramp}}', this._generateCategoryRamp(symbol));
      }
    }
    style = style.replace(/{{defaultColor}}/g, defColor);
    if (originalWidth) {
      style = style.replace('{{markerWidth}}', originalWidth);
    } else {
      style = style.replace('{{markerWidth}}', 7);
    }
    return style;
  },

  _generateCategoryRamp: function (sym) {
    var cats = this.dataviewModel.get('allCategoryNames');
    var geomMap = { polygon: 'polygon-fill', marker: 'marker-fill', line: 'line-color' };
    var ramp = cats.map(function (c, i) {
      var color = this.colors.getColorByCategory(c);
      return '[' + this.dataviewModel.get('column') + '=\'' + cats[i] + '\']{\n' + geomMap[sym] + ': ' + color + ';\n}';
    }.bind(this)).join('\n');
    return ramp;
  }
});

module.exports = CategoryAutoStyler;
