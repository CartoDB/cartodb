var _ = require('underscore');
var config = require('cdb.config');
var LayerModelBase = require('./layer-model-base');

var CartoDBLayer = LayerModelBase.extend({
  defaults: {
    attribution: config.get('cartodb_attributions'),
    type: 'CartoDB',
    visible: true
  },

  initialize: function (attrs, options) {
    LayerModelBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    this._map = options.map;
    if (attrs && attrs.cartocss) {
      this.set('initialStyle', attrs.cartocss);
    }
    this.bind('change:visible change:sql change:source', this._reloadMap, this);
    this.bind('change:cartocss', this._setCartoCSS);
  },

  _setCartoCSS: function (layer, cartocss) {
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
    var style = this.get('cartocss');
    if (style.indexOf('marker') > -1) {
      return 'marker';
    } else if (style.indexOf('polygon') > -1) {
      return 'polygon';
    } else if (style.indexOf('line') > -1) {
      return 'line';
    }
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
    var infowindow = this.getInfowindowData();
    if (infowindow && infowindow.fields) {
      names = _.pluck(infowindow.fields, 'name');
    }
    return names;
  },

  getInfowindowData: function () {
    var infowindow = this.get('infowindow');
    if (infowindow && infowindow.fields && infowindow.fields.length) {
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
