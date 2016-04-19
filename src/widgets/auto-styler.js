var cdb = require('cartodb.js');
var CategoryColors = require('./category/category-colors');
var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel) {
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors();
    this.vector = !!this.dataviewModel._dataProvider;
  },

  getStyle: function () {
    var style;
    var widgetType = this.dataviewModel.get('type');
    if (widgetType === 'category') {
      style = this._getStyleForCategory();
    } else if (widgetType === 'histogram') {
      style = this._getStyleForHistogram();
    }
    return style;
  },

  _getStyleForHistogram: function () {
    var style = '';
    var colors = ['YlGnBu', 'Greens', 'Reds', 'Blues'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var stylesByGeometry = AutoStyler.STYLE_TEMPLATE;
    if (this.vector) {
      var geometryType = this._getGeometryType();
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
  },

  _getStyleForCategory: function () {
    var style = '';
    var defColor = this.colors.getColorByCategory('Other');
    var stylesByGeometry = AutoStyler.STYLE_TEMPLATE;
    if (this.vector) {
      var geometryType = this._getGeometryType();
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
    return style
      .replace(/{{defaultColor}}/g, defColor)
      .replace('{{markerWidth}}', 10);
  },

  _getLayerHeader: function (symbol) {
    return '#' + this.dataviewModel.layer.get('layer_name') + '[mapnik-geometry-type=' + AutoStyler.MAPNIK_MAPPING[symbol] + ']{';
  },

  _getGeometryType: function () {
    var index = this.dataviewModel._dataProvider._layerIndex;
    var sublayer = this.dataviewModel._dataProvider._vectorLayerView;
    var style = sublayer.styles[index];
    if (style.indexOf('marker') > -1) {
      return 'marker';
    } else if (style.indexOf('polygon') > -1) {
      return 'polygon';
    } else if (style.indexOf('line') > -1) {
      return 'line';
    }
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

AutoStyler.STYLE_TEMPLATE = {
  polygon: ['{{layername}}',
            '  polygon-fill: {{defaultColor}};',
            '  polygon-opacity: 0.6;  ',
            '  line-color: #FFF;',
            '  line-width: 0.3;',
            '  line-opacity: 0.3;',
            '  {{ramp}}',
            '}'].join('\n'),
  marker: ['{{layername}}',
         '  marker-width: {{markerWidth}};',
         '  marker-fill-opacity: 0.8;  ',
         '  marker-fill: {{defaultColor}};  ',
         '  marker-line-color: #fff;',
         '  marker-allow-overlap: true;',
         '  marker-line-width: 0.3;',
         '  marker-line-opacity: 0.8;',
         '  {{ramp}}',
         '}'].join('\n'),
  line: ['{{layername}}',
          '  line-color: {{defaultColor}};',
          '  line-width: 0.3;',
          '  line-opacity: 0.3;',
          '  {{ramp}}',
          '}'].join('\n')
};

AutoStyler.MAPNIK_MAPPING = {
  polygon: 'polygon',
  marker: 'point',
  line: 'linestring'
};

module.exports = AutoStyler;
