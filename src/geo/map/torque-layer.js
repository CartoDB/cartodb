var _ = require('underscore');
var MapLayer = require('./map-layer');
var Backbone = require('backbone');

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
    this.widgets = new Backbone.Collection([]);

    this.widgets.bind('change:filter', function(widget, filter) {
      this.trigger('change:filter', this, widget, filter);
    }, this);

    MapLayer.prototype.initialize.apply(this, arguments);
  },

  // Expected to be called from view, to keep the model in sync,
  // so other views can listen to the model w/o have to know what view implementation is used
  initBindsForTorqueLayerView: function(torqueLayerView) {
    torqueLayerView.bind('change:steps', function() {
      this.set('step', torqueLayerView.getStep());
    }, this);

    torqueLayerView.bind('play', this.set.bind(this, 'isRunning', true));
    torqueLayerView.bind('pause', this.set.bind(this, 'isRunning', false));

    this.set({
      isRunning: torqueLayerView.isRunning(),
      timeBounds: torqueLayerView.getTimeBounds(),
      step: torqueLayerView.getStep(),
      steps: torqueLayerView.options.steps
    });

    this.bind('run', function(run) {
      if (run) {
        torqueLayerView.play();
      } else {
        torqueLayerView.pause();
      }
    })
  },

  play: function() {
    this.trigger('run', true);
  },

  pause: function() {
    this.trigger('run', false);
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

  getFilters: function() {
    return this.widgets.map(function(widget) {
      return widget.getFilter();
    });
  },

  fetchAttributes: function(layer, featureID, callback) {
  }

});

module.exports = TorqueLayer;
