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
    if (!options.vis) throw new Error('vis is required');

    this._vis = options.vis;
    if (attrs && attrs.cartocss) {
      this.set('initialStyle', attrs.cartocss);
    }

    // TODO: Throw error if source is not present
    if (attrs.source) {
      this.setSource(attrs.source);
    }

    // PUBLIC PROPERTIES
    this.infowindow = new InfowindowTemplate(attrs.infowindow);
    this.tooltip = new TooltipTemplate(attrs.tooltip);
    this.unset('infowindow');
    this.unset('tooltip');

    this.legends = new Legends(attrs.legends, {
      visModel: this._vis
    });
    this.unset('legends');

    this.bind('change', this._onAttributeChanged, this);
    this.infowindow.fields.bind('reset add remove', this._reloadVis, this);
    this.tooltip.fields.bind('reset add remove', this._reloadVis, this);

    LayerModelBase.prototype.initialize.apply(this, arguments);
  },

  _onAttributeChanged: function () {
    var reloadVis = _.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
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
    var onlySourceChanged = attrs.source && _.keys(attrs).length === 1;

    if (attrs.source) {
      console.warn('Deprecated: Use ".setSource" to update a layer\'s source instead of the update method');
      var source = CartoDBLayer.getLayerSourceFromAttrs(attrs, this._vis.analysis);
      this.setSource(source, { silent: !onlySourceChanged });
      delete attrs.source;
    }

    LayerModelBase.prototype.update.call(this, attrs, { silent: onlySourceChanged });
  },

  remove: function () {
    this.getSource().unmarkAsSourceOf(this);
    LayerModelBase.prototype.remove.apply(this, arguments);
  }
},
// Static methods and properties
{
  /**
   * Return the source analysis node from given attrs object.
   */
  getLayerSourceFromAttrs: function (attrs, analysis) {
    if (typeof attrs.source === 'string') {
      console.warn('Deprecated: Layers must have an analysis node as source instead of a string ID.');
      var source = analysis.findNodeById(attrs.source);
      if (source) {
        return source;
      }
      throw new Error('No analysis found with id: ' + attrs.source);
    }
    if (attrs.source instanceof AnalysisModel) {
      return attrs.source;
    }
    throw new Error('Invalid layer source. Source must be an ID or an Analysis node but got: ' + attrs.source);
  }
});

module.exports = CartoDBLayer;
