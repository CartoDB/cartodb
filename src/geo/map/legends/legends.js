var _ = require('underscore');
var CategoryLegendModel = require('./category-legend-model');
var BubbleLegendModel = require('./bubble-legend-model');
var ChoroplethLegendModel = require('./choropleth-legend-model');
var CustomLegendModel = require('./custom-legend-model');
var HTMLLegendModel = require('./html-legend-model');

var LEGENDS_METADATA = {
  bubble: {
    modelClass: BubbleLegendModel,
    attrs: [ { 'fillColor': 'fill_color' } ],
    dynamic: true
  },
  category: {
    modelClass: CategoryLegendModel,
    attrs: [ 'prefix', 'sufix' ],
    dynamic: true
  },
  choropleth: {
    modelClass: ChoroplethLegendModel,
    attrs: [ 'prefix', 'sufix' ],
    dynamic: true
  },
  custom: {
    modelClass: CustomLegendModel,
    attrs: [ 'items' ]
  },
  html: {
    modelClass: HTMLLegendModel,
    attrs: [ 'html' ]
  }
};

var SHARED_ATTRS = [
  'title',
  { 'preHTMLSnippet': 'pre_html_snippet' },
  { 'postHTMLSnippet': 'post_html_snippet' }
];

var Legends = function (legendsData, deps) {
  if (!deps.visModel) throw new Error('visModel is required');

  this._legendsData = legendsData || [];
  this._visModel = deps.visModel;

  _.each(LEGENDS_METADATA, function (legendMetadata, legendType) {
    this[legendType] = this._createLegendModel(legendType, legendMetadata);
  }, this);

  this._visModel.on('reload', this._onVisReloading, this);
};

Legends.prototype._createLegendModel = function (legendType, legendMetadata) {
  var ModelClass = legendMetadata.modelClass;
  var attrs = SHARED_ATTRS.concat(legendMetadata.attrs);
  var data = this._findDataForLegend(legendType);

  var modelAttrs = {};
  _.each(attrs, function (attr) {
    var attrNameInData = attr;
    var attrNameForModel = attr;
    if (_.isObject(attr)) {
      attrNameForModel = Object.keys(attr)[0];
      attrNameInData = attr[attrNameForModel];
    }

    modelAttrs[attrNameForModel] = data && data[attrNameInData];
  });

  return new ModelClass(modelAttrs);
};

Legends.prototype._findDataForLegend = function (legendType) {
  return _.find(this._legendsData, { type: legendType });
};

Legends.prototype._onVisReloading = function () {
  _.each(this._getModelsForDynamicLegends(), function (legendModel) {
    legendModel.set('state', 'loading');
  });
};

Legends.prototype._getModelsForDynamicLegends = function () {
  return _.chain(LEGENDS_METADATA)
    .map(function (legendMetadata, legendType) {
      if (legendMetadata.dynamic === true) {
        return this[legendType];
      }
    }.bind(this))
    .compact()
    .value();
};

module.exports = Legends;
