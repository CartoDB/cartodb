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
    attrNames: [ 'fillColor' ]
  },
  {
    type: 'category',
    modelClass: CategoryLegendModel,
    attrNames: [ 'prefix', 'sufix' ]
  },
  {
    type: 'choropleth',
    modelClass: ChoroplethLegendModel,
    attrNames: [ 'prefix', 'sufix' ]
  },
  {
    type: 'custom',
    modelClass: CustomLegendModel,
    attrNames: [ 'items' ]
  },
  {
    type: 'html',
    modelClass: HTMLLegendModel,
    attrNames: [ 'html' ]
  }
];

var Legends = function (legendsData) {
  legendsData = legendsData || {};

  _.each(LEGENDS_METADATA, function (legendMetadata) {
    var type = legendMetadata.type;
    var ModelClass = legendMetadata.modelClass;
    var attrNames = legendMetadata.attrNames;

    var data = _.find(legendsData, { type: type });

    var modelAttrs = _.extend(
      { visible: true },
      _.pick(data, attrNames),
      _.pick(data, 'title')
    );
    this[type] = new ModelClass(modelAttrs);
  }, this);
};

module.exports = Legends;
