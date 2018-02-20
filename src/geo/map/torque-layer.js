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
var LAYER_CARTOCSS_PROPS = [
  'marker-width'
];
var LAYER_NAME_IN_CARTO_CSS = '#layer';
var TORQUE_LAYER_NAME_IN_CARTO_CSS = 'Map';
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
    if (!options.engine) throw new Error('engine is required');

    this._engine = options.engine;

    if (attrs.source) {
      this.setSource(attrs.source);
    }

    this.legends = new Legends(attrs.legends, { engine: this._engine });
    this.unset('legends');

    this.bind('change', this._onAttributeChanged, this);

    LayerModelBase.prototype.initialize.apply(this, arguments);
  },

  _onAttributeChanged: function () {
    var reload = _.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
        if (attr === 'cartocss') {
          return this.previous('cartocss') && this._torqueCartoCSSPropsChanged();
        }
        return true;
      }
    }, this);

    if (reload) {
      this._reload();
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
    var torqueLayer = shader.findLayer({ name: TORQUE_LAYER_NAME_IN_CARTO_CSS });
    var layer = shader.findLayer({ name: LAYER_NAME_IN_CARTO_CSS });

    var properties = {};
    _.each(TORQUE_LAYER_CARTOCSS_PROPS, function (property) {
      var value = torqueLayer && torqueLayer.eval(property);
      if (value) {
        properties[property] = value;
      }
    });
    _.each(LAYER_CARTOCSS_PROPS, function (property) {
      var value = layer && layer.eval(property);
      if (value) {
        properties[property] = value;
      }
    });

    return properties;
  },

  _reload: function () {
    this._engine.reload({
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

  fetchAttributes: function (layer, featureID, callback) { },

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
    if (attrs.source) {
      throw new Error('Use ".setSource" to update a layer\'s source instead of the update method');
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
  _checkSourceAttribute: function (source) {
    if (!(source instanceof AnalysisModel)) {
      throw new Error('Source must be an instance of AnalysisModel');
    }
  }
});

module.exports = TorqueLayer;
