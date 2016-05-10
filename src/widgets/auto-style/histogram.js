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
    var shape = this.dataviewModel.getHistogramShape();
    if (geometryType === 'polygon') {
      style = style.replace('{{defaultColor}}', 'ramp([{{column}}], colorbrewer({{color}}, {{bins}}))');
    } else if (geometryType === 'marker') {
      if (shape === 'F') {
        style = style.replace('{{defaultColor}}', 'ramp([{{column}}], cartocolor(RedOr1, {{bins}}))')
                     .replace('{{markerWidth}}', '6');
      } else if (shape === 'L' || shape === 'J') {
        style = style.replace('{{defaultColor}}', 'ramp([{{column}}], cartocolor(Sunset2, {{bins}}), headstails)')
                     .replace('{{markerWidth}}', '6');
      } else if (shape === 'A') {
        style = style.replace('{{defaultColor}}', 'ramp([{{column}}], cartocolor(Geyser, {{bins}}))')
                     .replace('{{markerWidth}}', '6');
      } else {
        style = style.replace('{{markerWidth}}', 'ramp([{{column}}], {{min}}, {{max}}, {{bins}})');
      }
    } else {
      style = style.replace('{{defaultColor}}', '#3e57b5');
    }
    return style;
  }
});

module.exports = HistogramAutoStyler;
