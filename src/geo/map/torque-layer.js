var _ = require('underscore');
var LayerModelBase = require('./layer-model-base');
var carto = require('carto');
var Legends = require('./legends/legends');
var postcss = require('postcss');
var AnalysisModel = require('../../analysis/analysis-model');

var ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD = ['sql', 'sql_wrap', 'source', 'cartocss'];
var TORQUE_LAYER_CARTOCSS_PROPS = [
  '-torque-frame-count',
  '-torque-time-attribute',
  '-torque-aggregation-function',
  '-torque-data-aggregation',
  '-torque-resolution'
];
var LAYER_NAME_IN_CARTO_CSS = 'Map';
var DEFAULT_ANIMATION_DURATION = 30;
var TORQUE_DURATION_ATTRIBUTE = '-torque-animation-duration';

/**
 * Model for a Torque Layer
 */
var TorqueLayer = LayerModelBase.extend({
  defaults: {
    type: 'torque',
    visible: true,
    isRunning: false,
    renderRange: {
      start: undefined,
      end: undefined
    },
    subdomains: [0, 1, 2, 3],
    steps: 0,
    step: 0,
    time: undefined // should be a Date instance
  },

  // Helper method to be used from a few places, it parses torque cartocss to get
  // the animation duration or a default duration
  getAnimationDuration: function (cartocss) {
    var cssTree = postcss().process(cartocss);
    var root = cssTree.result.root;
    var torqueDuration = DEFAULT_ANIMATION_DURATION;

    root.walkDecls(TORQUE_DURATION_ATTRIBUTE, function (decl) {
      torqueDuration = parseInt(decl.value, 10);
    });

    return torqueDuration;
  },

  initialize: function (attrs, options) {
    options = options || {};
    if (!options.vis) throw new Error('vis is required');

    this._vis = options.vis;

    // TODO: Throw error if source is not present
    if (attrs.source) {
      this.setSource(attrs.source);
    }

    this.legends = new Legends(attrs.legends, {
      visModel: this._vis
    });
    this.unset('legends');

    this.bind('change', this._onAttributeChanged, this);

    LayerModelBase.prototype.initialize.apply(this, arguments);
  },

  _onAttributeChanged: function () {
    var reloadVis = _.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
        if (attr === 'cartocss') {
          return this.previous('cartocss') && this._torqueCartoCSSPropsChanged();
        }
        return true;
      }
    }, this);

    if (reloadVis) {
      this._reloadVis();
    }
  },

  _torqueCartoCSSPropsChanged: function () {
    var currentCartoCSS = this.get('cartocss');
    var previousCartoCSS = this.previous('cartocss');
    var renderer = new carto.RendererJS();

    return !_.isEqual(
      this._getTorqueLayerCartoCSSProperties(renderer, currentCartoCSS),
      this._getTorqueLayerCartoCSSProperties(renderer, previousCartoCSS)
    );
  },

  _getTorqueLayerCartoCSSProperties: function (renderer, cartoCSS) {
    var shader = renderer.render(cartoCSS);
    var layer = shader.findLayer({ name: LAYER_NAME_IN_CARTO_CSS });
    var properties = {};
    _.each(TORQUE_LAYER_CARTOCSS_PROPS, function (property) {
      var value = layer && layer.eval(property);
      if (value) {
        properties[property] = value;
      }
    });

    return properties;
  },

  _reloadVis: function () {
    this._vis.reload({
      sourceId: this.get('id')
    });
  },

  play: function () {
    this.set('isRunning', true);
  },

  pause: function () {
    this.set('isRunning', false);
  },

  setStep: function (step) {
    this.set('step', step);
  },

  renderRange: function (start, end) {
    this.set('renderRange', {
      start: start,
      end: end
    });
  },

  resetRenderRange: function () {
    this.set('renderRange', {});
  },

  isEqual: function (other) {
    var properties = ['query', 'query_wrapper', 'cartocss'];
    var self = this;
    return this.get('type') === other.get('type') && _.every(properties, function (p) {
      return other.get(p) === self.get(p);
    });
  },

  getName: function () {
    return this.get('layer_name');
  },

  fetchAttributes: function (layer, featureID, callback) {},

  // given a timestamp returns a step (float)
  timeToStep: function (timestamp) {
    var steps = this.get('steps');
    var start = this.get('start');
    var end = this.get('end');
    var step = (steps * (1000 * timestamp - start)) / (end - start);
    return step;
  },

  getTileURLTemplates: function () {
    return this.get('tileURLTemplates');
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
      console.warn('Deprecated: Use ".setSource" to update a layer\'s source instead the update method');
      var source = TorqueLayer.getLayerSourceFromAttrs(attrs, this._vis.analysis);
      this.setSource(source, { silent: !onlySourceChanged });
      delete attrs.source;
    }
    LayerModelBase.prototype.update.apply(this, arguments);
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

module.exports = TorqueLayer;
