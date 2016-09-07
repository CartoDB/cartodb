var _ = require('underscore');
var config = require('../../cdb.config');
var LayerModelBase = require('./layer-model-base');
var InfowindowTemplate = require('./infowindow-template');
var TooltipTemplate = require('./tooltip-template');
var CategoryLegendModel = require('./legends/category-legend-model');
var BubbleLegendModel = require('./legends/bubble-legend-model');
var ChoroplethLegendModel = require('./legends/choropleth-legend-model');
var CustomLegendModel = require('./legends/custom-legend-model');

var CartoDBLayer = LayerModelBase.extend({
  defaults: {
    type: 'CartoDB',
    attribution: config.get('cartodb_attributions'),
    visible: true
  },

  ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD: ['sql', 'source', 'sql_wrap', 'cartocss'],

  initialize: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};
    if (!options.vis) throw new Error('vis is required');

    this._vis = options.vis;
    if (attrs && attrs.cartocss) {
      this.set('initialStyle', attrs.cartocss);
    }

    // PUBLIC PROPERTIES
    this.infowindow = new InfowindowTemplate(attrs.infowindow);
    this.tooltip = new TooltipTemplate(attrs.tooltip);
    this.unset('infowindow');
    this.unset('tooltip');

    this.legends = {
      category: new CategoryLegendModel(),
      bubble: new BubbleLegendModel(),
      choropleth: new ChoroplethLegendModel(),
      custom: new CustomLegendModel()
    };
    this._initLegends(attrs.legends);
    this.unset('legends');

    this.bind('change', this._onAttributeChanged, this);

    LayerModelBase.prototype.initialize.apply(this, arguments);
  },

  /**
   * [_initLegends description]
   * @param  {array} legendsData eg:
   *   [
   *     { type: 'bubble', title: 'Barrios Legend' },
   *     { type: 'category', title: 'Categories Legend' }
   *   ]
   * @return {[type]}             [description]
   */
  _initLegends: function (legendsData) {
    legendsData = legendsData || {};

    // category legend
    var categoryLegend = _.find(legendsData, { type: 'category' });
    if (categoryLegend) {
      this.legends.category.set({
        title: categoryLegend.title,
        prefix: categoryLegend.prefix,
        sufix: categoryLegend.sufix,
        visible: true
      });
    }

    // bubble legend
    var bubbleLegend = _.find(legendsData, { type: 'bubble' });
    if (bubbleLegend) {
      this.legends.bubble.set({
        title: bubbleLegend.title,
        fillColor: bubbleLegend.fill_color,
        visible: true
      });
    }

    // choropleth legend
    var choroplethLegend = _.find(legendsData, { type: 'choropleth' });
    if (choroplethLegend) {
      this.legends.choropleth.set({
        title: choroplethLegend.title,
        prefix: choroplethLegend.prefix,
        sufix: choroplethLegend.sufix,
        visible: true
      });
    }

    // custom legend
    var customLegend = _.find(legendsData, { type: 'custom' });
    if (customLegend) {
      this.legends.custom.set({
        title: customLegend.title,
        items: customLegend.items,
        visible: true
      });
    }
  },

  _onAttributeChanged: function () {
    var reloadVis = _.any(this.ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
        if (attr === 'cartocss' && this._dataProvider) {
          return false;
        }
        return true;
      }
    }, this);

    if (reloadVis) {
      this._reloadVis();
    }
  },

  _reloadVis: function () {
    this._vis.reload({
      sourceId: this.get('id')
    });
  },

  restoreCartoCSS: function () {
    this.set('cartocss', this.get('initialStyle'));
  },

  isVisible: function () {
    return this.get('visible');
  },

  hasInteraction: function () {
    return this.isVisible() && (this._hasInfowindowFields() || this._hasTooltipFields());
  },

  _hasInfowindowFields: function () {
    return this.infowindow.hasFields();
  },

  _hasTooltipFields: function () {
    return this.tooltip.hasFields();
  },

  getGeometryType: function () {
    if (this._dataProvider) {
      var index = this._dataProvider._layerIndex;
      var sublayer = this._dataProvider._vectorLayerView.renderers[index];
      return sublayer.inferGeometryType();
    }
    return null;
  },

  getInteractiveColumnNames: function () {
    var fieldNames = _.union(
      this.infowindow.getFieldNames(),
      this.tooltip.getFieldNames()
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
