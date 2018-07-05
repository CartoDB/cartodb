var _ = require('underscore');
var config = require('../../cdb.config');
var LayerModelBase = require('./layer-model-base');
var InfowindowTemplate = require('./infowindow-template');
var TooltipTemplate = require('./tooltip-template');
var Legends = require('./legends/legends');
var AnalysisModel = require('../../analysis/analysis-model');

var ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD = ['sql', 'source', 'sql_wrap', 'cartocss'];

var CartoDBLayer = LayerModelBase.extend({
  defaults: {
    type: 'CartoDB',
    attribution: config.get('cartodb_attributions'),
    visible: true
  },

  initialize: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};
    if (!options.engine) throw new Error('engine is required');

    this._engine = options.engine;
    if (attrs && attrs.cartocss) {
      this.set('initialStyle', attrs.cartocss);
    }

    if (attrs.source) {
      this.setSource(attrs.source);
    }

    // PUBLIC PROPERTIES
    this.infowindow = new InfowindowTemplate(attrs.infowindow);
    this.tooltip = new TooltipTemplate(attrs.tooltip);
    this.unset('infowindow');
    this.unset('tooltip');

    this.legends = new Legends(attrs.legends, { engine: this._engine });
    this.unset('legends');

    this.bind('change', this._onAttributeChanged, this);
    this.infowindow.fields.bind('reset add remove', this._reload, this);
    this.tooltip.fields.bind('reset add remove', this._reload, this);

    this.aggregation = options.aggregation;

    LayerModelBase.prototype.initialize.apply(this, arguments);
  },

  _onAttributeChanged: function () {
    var reload = _.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
        return true;
      }
    }, this);

    if (reload) {
      this._reload();
    }
  },

  _reload: function () {
    this._engine.reload({
      sourceId: this.get('id')
    });
  },

  restoreCartoCSS: function () {
    this.set('cartocss', this.get('initialStyle'));
  },

  isVisible: function () {
    return this.get('visible');
  },

  isInteractive: function () {
    return this._hasInfowindowFields() || this._hasTooltipFields();
  },

  _hasInfowindowFields: function () {
    return this.infowindow.hasFields();
  },

  _hasTooltipFields: function () {
    return this.tooltip.hasFields();
  },

  getInteractiveColumnNames: function () {
    return _.chain(['cartodb_id'])
      .union(this.infowindow.getFieldNames())
      .union(this.tooltip.getFieldNames())
      .uniq()
      .value();
  },

  isInfowindowEnabled: function () {
    return this.infowindow.hasTemplate();
  },

  isTooltipEnabled: function () {
    return this.tooltip.hasTemplate();
  },

  getName: function () {
    return this.get('layer_name');
  },

  getEstimatedFeatureCount: function () {
    var meta = this.get('meta');
    var stats = meta && meta.stats;
    return stats && stats.estimatedFeatureCount;
  },

  getSourceId: function () {
    var source = this.getSource();
    return source && source.id;
  },

  getSource: function () {
    return this.get('source');
  },

  setSource: function (newSource, options) {
    if (this.getSource()) {
      this.getSource().unmarkAsSourceOf(this);
    }
    newSource.markAsSourceOf(this);
    this.set('source', newSource, options);
  },

  /**
   * Check if an analysis node is the layer's source.
   * Only torque and cartodb layers have a source otherwise return false.
   */
  hasSource: function (analysisModel) {
    return this.getSource().equals(analysisModel);
  },

  update: function (attrs) {
    if (attrs.source) {
      throw new Error('Use ".setSource" to update a layer\'s source instead of the update method');
    }
    LayerModelBase.prototype.update.apply(this, arguments);
  },

  remove: function () {
    this.getSource().unmarkAsSourceOf(this);
    LayerModelBase.prototype.remove.apply(this, arguments);
  },

  getTableName: function () {
    if (this.get('source').has('options')) {
      return this.get('source').get('options').table_name;
    }
  },

  getApiKey: function () {
    return this._engine.getApiKey();
  }
},
  // Static methods and properties
{
  _checkSourceAttribute: function (source) {
    if (!(source instanceof AnalysisModel)) {
      throw new Error('Source must be an instance of AnalysisModel');
    }
  }
});

module.exports = CartoDBLayer;
