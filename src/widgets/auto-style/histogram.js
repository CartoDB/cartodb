var AutoStyler = require('./auto-styler');
var HistogramAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = '';
    var colors = ['YlGnBu', 'Greens', 'Reds', 'Blues'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var stylesByGeometry = AutoStyler.STYLE_TEMPLATE;
    var geometryType = this.layer.getGeometryType();
    if (geometryType) {
      style = this._getHistGeometry(geometryType)
        .replace('{{layername}}', '#layer{');
    } else {
      for (var symbol in stylesByGeometry) {
        style += this._getHistGeometry(symbol)
          .replace('{{layername}}', this._getLayerHeader(symbol));
      }
    }
    return style.replace(/{{column}}/g, this.dataviewModel.get('column'))
      .replace(/{{bins}}/g, this.dataviewModel.get('bins'))
      .replace(/{{color}}/g, color)
      .replace(/{{min}}/g, 1)
      .replace(/{{max}}/g, 20)
      .replace(/{{ramp}}/g, '')
      .replace(/{{defaultColor}}/g, '#000');
  },

  _getHistGeometry: function (geometryType) {
    var style = AutoStyler.STYLE_TEMPLATE[geometryType];
    if (geometryType === 'polygon') {
      style = style.replace('{{defaultColor}}', 'ramp([{{column}}], colorbrewer({{color}}, {{bins}}))');
    } else if (geometryType === 'marker') {
      style = style.replace('{{markerWidth}}', 'ramp([{{column}}], {{min}}, {{max}}), {{bins}})');
    } else {
      style = style.replace('{{defaultColor}}', '#000');
    }
    return style;
  }
});

module.exports = HistogramAutoStyler;
