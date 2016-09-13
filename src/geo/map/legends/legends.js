var _ = require('underscore');
var CategoryLegendModel = require('./category-legend-model');
var BubbleLegendModel = require('./bubble-legend-model');
var ChoroplethLegendModel = require('./choropleth-legend-model');
var CustomLegendModel = require('./custom-legend-model');
var HTMLLegendModel = require('./html-legend-model');

var LEGENDS_METADATA = [
  {
    type: 'bubble',
    modelClass: BubbleLegendModel,
    attrs: [ { 'fillColor': 'fill_color' } ]
  },
  {
    type: 'category',
    modelClass: CategoryLegendModel,
    attrs: [ 'prefix', 'sufix' ]
  },
  {
    type: 'choropleth',
    modelClass: ChoroplethLegendModel,
    attrs: [ 'prefix', 'sufix' ]
  },
  {
    type: 'custom',
    modelClass: CustomLegendModel,
    attrs: [ 'items' ]
  },
  {
    type: 'html',
    modelClass: HTMLLegendModel,
    attrs: [ 'html' ]
  }
];

var SHARED_ATTRS = [
  'title',
  { 'preHTMLSnippet': 'pre_html_snippet' },
  { 'postHTMLSnippet': 'post_html_snippet' }
];

var Legends = function (legendsData) {
  legendsData = legendsData || {};

  _.each(LEGENDS_METADATA, function (legendMetadata) {
    var type = legendMetadata.type;
    var ModelClass = legendMetadata.modelClass;
    var attrs = SHARED_ATTRS.concat(legendMetadata.attrs);
    var data = _.find(legendsData, { type: type });

    var modelAttrs = { visible: true };
    _.each(attrs, function (attr) {
      var attrNameInData = attr;
      var attrNameForModel = attr;
      if (_.isObject(attr)) {
        attrNameForModel = Object.keys(attr)[0];
        attrNameInData = attr[attrNameForModel];
      }

      modelAttrs[attrNameForModel] = data && data[attrNameInData];
    });

    this[type] = new ModelClass(modelAttrs);
  }, this);
};

module.exports = Legends;
