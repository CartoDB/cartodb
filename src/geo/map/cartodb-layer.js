var _ = require('underscore');
var config = require('cdb.config');
var LayerModelBase = require('./layer-model-base');
var InfowindowTemplate = require('./infowindow-template');

var CartoDBLayer = LayerModelBase.extend({
  defaults: {
    attribution: config.get('cartodb_attributions'),
    type: 'CartoDB',
    visible: true
  },

  initialize: function (attrs, options) {
    attrs = attrs || {};
    LayerModelBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    this._map = options.map;
    if (attrs && attrs.cartocss) {
      this.set('initialStyle', attrs.cartocss);
    }

    this.infowindow = new InfowindowTemplate(attrs.infowindow);
    this.unset('infowindow');

    this.bind('change:visible change:sql change:source', this._reloadMap, this);
    this.bind('change:cartocss', this._onCartoCSSChanged);
  },

  _onCartoCSSChanged: function (layer, cartocss) {
    if (!layer._dataProvider) {
      layer._reloadMap();
    }
  },

  _reloadMap: function () {
    this._map.reload({
      sourceLayerId: this.get('id')
    });
  },

  restoreCartoCSS: function () {
    this.set('cartocss', this.get('initialStyle'));
  },

  hasInteraction: function () {
    return this.isVisible() && (this.containInfowindow() || this.containTooltip());
  },

  isVisible: function () {
    return this.get('visible');
  },

  getGeometryType: function () {
    if (this._dataProvider) {
      var index = this._dataProvider._layerIndex;
      var sublayer = this._dataProvider._vectorLayerView.renderers[index];
      return sublayer.inferGeometryType();
    }
    return null;
  },

  getTooltipFieldNames: function () {
    var names = [];
    var tooltip = this.getTooltipData();
    if (tooltip && tooltip.fields) {
      names = _.pluck(tooltip.fields, 'name');
    }
    return names;
  },

  getTooltipData: function () {
    var tooltip = this.get('tooltip');
    if (tooltip && tooltip.fields && tooltip.fields.length) {
      return tooltip;
    }
    return null;
  },

  containInfowindow: function () {
    return !!this.getTooltipData();
  },

  getInfowindowFieldNames: function () {
    var names = [];
    var infowindow = this.infowindow;
    if (infowindow && infowindow.get('fields')) {
      names = _.pluck(infowindow.get('fields'), 'name');
    }
    return names;
  },

  getInfowindowData: function () {
    var infowindow = this.infowindow;
    if (infowindow && infowindow.get('fields').length) {
      return infowindow;
    }
    return null;
  },

  containTooltip: function () {
    return !!this.getInfowindowData();
  },

  getInteractiveColumnNames: function () {
    var fieldNames = _.union(
      this.getInfowindowFieldNames(),
      this.getTooltipFieldNames()
    );
    if (fieldNames.length) {
      fieldNames.unshift('cartodb_id');
    }
    return _.uniq(fieldNames);
  },

  // Layers inside a "layergroup" layer have the layer_name defined in options.layer_name
  // Layers inside a "namedmap" layer have the layer_name defined in the root of their definition
  getName: function () {
    return this.get('options') && this.get('options').layer_name || this.get('layer_name');
  },

  setDataProvider: function (dataProvider) {
    this._dataProvider = dataProvider;
  },

  getDataProvider: function () {
    return this._dataProvider;
  }
});

module.exports = CartoDBLayer;
