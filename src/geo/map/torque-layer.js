var _ = require('underscore');
var LayerModelBase = require('./layer-model-base');
var carto = require('carto');

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
    steps: 0,
    step: 0,
    time: undefined // should be a Date instance
  },

  ATTRIBUTES_THAT_TRIGGER_MAP_RELOAD: ['visible', 'sql', 'source', 'cartocss'],

  TORQUE_LAYER_CARTOCSS_PROPS: [
    '-torque-frame-count',
    '-torque-time-attribute',
    '-torque-aggregation-function',
    '-torque-data-aggregation',
    '-torque-resolution'
  ],

  LAYER_NAME_IN_CARTO_CSS: 'Map',

  initialize: function (attrs, options) {
    LayerModelBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    this._map = options.map;
    this.bind('change', this._onAttributeChanged, this);
  },

  _onAttributeChanged: function () {
    var reloadMap = _.any(this.ATTRIBUTES_THAT_TRIGGER_MAP_RELOAD, function (attr) {
      if (this.hasChanged(attr)) {
        if (attr === 'cartocss') {
          return this.previous('cartocss') && this._torqueCartoCSSPropsChanged();
        }
        return true;
      }
    }, this);

    if (reloadMap) {
      this._reloadMap();
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
    var layer = shader.findLayer({ name: this.LAYER_NAME_IN_CARTO_CSS });
    var properties = {};
    _.each(this.TORQUE_LAYER_CARTOCSS_PROPS, function (property) {
      var value = layer.eval(property);
      if (value) {
        properties[property] = value;
      }
    });

    return properties;
  },

  _reloadMap: function () {
    this._map.reload({
      sourceLayerId: this.get('id')
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

  isEqual: function(other) {
    var properties = ['query', 'query_wrapper', 'cartocss'];
    var self = this;
    return this.get('type') === other.get('type') && _.every(properties, function(p) {
      return other.get(p) === self.get(p);
    });
  },

  isVisible: function() {
    return true;
  },

  getName: function () {
    return this.get('layer_name') || this.get('table_name');
  },

  getInteractiveColumnNames: function() {
    return [];
  },

  getInfowindowFieldNames: function() {
    return [];
  },

  hasInteraction: function() {
    return this.getInteractiveColumnNames() > 0;
  },

  fetchAttributes: function(layer, featureID, callback) {
  },

  setDataProvider: function (dataProvider) {
    this._dataProvider = dataProvider;
  },

  getDataProvider: function () {
    return this._dataProvider;
  },

  // given a timestamp returns a step (float)
  timeToStep: function(timestamp) {
    var steps = this.get('steps');
    var start = this.get('start');
    var end = this.get('end');
    var step = (steps * (1000*timestamp - start)) / (end - start);
    return step;
  }
});

module.exports = TorqueLayer;
