var _ = require('underscore');
var MapLayer = require('./map-layer');

/**
 * Model for a Torque Layer
 */
var TorqueLayer = MapLayer.extend({
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

  initialize: function(attrs, options) {
    options = options || {};
    MapLayer.prototype.initialize.apply(this, arguments);

    this._map = options.map;
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

  getInfowindowData: function() {
    // TODO: use infowindow model in the future
    var infowindow = this.get('infowindow');
    if (infowindow && infowindow.fields && infowindow.fields.length) {
      return infowindow;
    }
    return null;
  },

  getTooltipData: function() {
    return null;
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
