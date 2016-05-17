var cdb = require('cartodb.js');
var CategoryColors = require('./category-colors');
var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel) {
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors();
    this.layer = this.dataviewModel.layer;
    var basemapStyle = dataviewModel.layer._map.layers.at(0).get('urlTemplate').indexOf('light') > -1? 'LIGHT': 'DARK';
    this.STYLE_TEMPLATE = AutoStyler['STYLE_TEMPLATE_' + basemapStyle];
  },

  _getLayerHeader: function (symbol) {
    return '#' + this.dataviewModel.layer.get('layer_name').replace(/\s*/g, '') + '[mapnik-geometry-type=' + AutoStyler.MAPNIK_MAPPING[symbol] + ']{';
  }

});

//for Light Basemap
AutoStyler.STYLE_TEMPLATE_LIGHT = {
  polygon: ['{{layername}}',
          '  polygon-fill: {{defaultColor}};',
          '  polygon-opacity: 0.9;  ',
          '  polygon-gamma: 0.5;    ',
          '  line-color: #fff;',
          '  line-width: 0.25;',
          '  line-opacity: 0.25;',
          '  line-comp-op: hard-light;',
          '  {{ramp}}',
          '}'].join('\n'),
  marker: ['{{layername}}',
         '  marker-width: {{markerWidth}};',
         '  marker-fill-opacity: 0.9;  ',
         '  marker-fill: {{defaultColor}};  ',
         '  marker-line-color: #fff;',
         '  marker-allow-overlap: true;',
         '  marker-line-width: 1;',
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

//for Dark Basemap
AutoStyler.STYLE_TEMPLATE_DARK = {
  polygon: ['{{layername}}',
          '  polygon-fill: {{defaultColor}};',
          '  polygon-opacity: 0.9;  ',
          '  polygon-gamma: 0.5;    ',
          '  line-color: #fff;',
          '  line-width: 0.25;',
          '  line-opacity: 0.25;',
          '  line-comp-op: hard-light;',
          '  {{ramp}}',
          '}'].join('\n'),
  marker: ['{{layername}}',
        '  marker-width: {{markerWidth}};',
        '  marker-fill-opacity: 0.9;  ',
        '  marker-fill: {{defaultColor}};  ',
        '  marker-line-color: #000;',
        '  marker-allow-overlap: true;',
        '  marker-line-width: 1;',
        '  marker-line-opacity: 0.5;',
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
  polygon: 3,
  marker: 1,
  line: 2
};

module.exports = AutoStyler;
