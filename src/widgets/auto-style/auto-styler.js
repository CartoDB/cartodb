var cdb = require('cartodb.js');
var CategoryColors = require('./category-colors');
var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel) {
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors();
    this.layer = this.dataviewModel.layer;
  },

  _getLayerHeader: function (symbol) {
    return '#' + this.dataviewModel.layer.get('layer_name').replace(/\s*/g, '') + '[mapnik-geometry-type=' + AutoStyler.MAPNIK_MAPPING[symbol] + ']{';
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
  polygon: 3,
  marker: 1,
  line: 2
};

module.exports = AutoStyler;
