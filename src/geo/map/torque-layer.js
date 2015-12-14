var _ = require('underscore');
var log = require('cdb.log');
var MapLayer = require('./map-layer');

/**
 * Model for a Torque Layer
 */
var TorqueLayer = MapLayer.extend({
  defaults: {
    type: 'torque',
    visible: true,

    // Values expected to be set from torque layer
    isRunning: false,
    timeBounds: {
      start: undefined,
      end: undefined
    },
    steps: 0,
    step: 0,
  },

  initialize: function() {
    MapLayer.prototype.initialize.apply(this, arguments);
  },

  // Custom setter to avoid trigger the generic 'change' event that would cause the tiles to be reloaded
  _setWithoutReloadingTiles: function(attr, val) {
    var prevVal = this.get(attr);
    this.set(attr, val, {silent: true});
    if (val !== prevVal) {
      this.trigger('change:' + attr, this, val);
    }
  },

  // Expected to be called from view, to keep the model in sync,
  // so other views can listen to the model w/o have to know what view implementation is used
  initForTorqueLayerView: function(torqueLayerView) {
    // Binds events from view to this moel
    torqueLayerView.bind('play', this._setWithoutReloadingTiles.bind(this, 'isRunning', true))
    torqueLayerView.bind('pause', this._setWithoutReloadingTiles.bind(this, 'isRunning', false))
    torqueLayerView.bind('change:time', function(changes) {
      this._setWithoutReloadingTiles('time', changes.time);
      this._setWithoutReloadingTiles('step', changes.step);
      if (_.isNumber(changes.start) && _.isNumber(changes.end)) {
        this._setWithoutReloadingTiles('renderRange', { start: changes.start, end: changes.end })
      }
    }, this);

    // Set initial values, but don't change
    this.set({
      isRunning: torqueLayerView.isRunning(),
      timeBounds: torqueLayerView.getTimeBounds(),
      time: torqueLayerView.getTime(),
      step: torqueLayerView.getStep(),
      steps: torqueLayerView.options.steps
    }, {
      silent: true
    });

    // Binds methods from this model to any views that are initialized
    var proxyMethods = [
      'play',
      'pause',
      'setStep',
      'renderRange',
      'resetRenderRange'
    ];
    proxyMethods.forEach(function(name) {
      var method = torqueLayerView[name]
      if (method) {
        this.bind(name, method, torqueLayerView);
      } else {
        log.error('torque layer (model): tried to proxy method ' + name + ', but it does not exist on the view');
      }
    }, this);

    // Clean up of events above when view is removed
    torqueLayerView.once('remove', function() {
      torqueLayerView.unbind('play');
      torqueLayerView.unbind('pause');
      torqueLayerView.unbind('change:time');
      proxyMethods.forEach(function(name) {
        this.unbind(name, torqueLayerView[name], torqueLayerView);
      });
    });
  },

  play: function() {
    this.trigger.apply(this, ['play'].concat(Array.prototype.slice.call(arguments)));
  },

  pause: function() {
    this.trigger.apply(this, ['pause'].concat(Array.prototype.slice.call(arguments)));
  },

  setStep: function() {
    this.trigger.apply(this, ['setStep'].concat(Array.prototype.slice.call(arguments)));
  },

  renderRange: function(start, end) {
    this.trigger.apply(this, ['renderRange'].concat(Array.prototype.slice.call(arguments)));
  },

  resetRenderRange: function() {
    this.trigger.apply(this, ['resetRenderRange'].concat(Array.prototype.slice.call(arguments)));
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
  }

});

module.exports = TorqueLayer;
