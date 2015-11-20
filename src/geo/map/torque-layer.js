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

  // TODO Update silently to avoid a generic change event, which causes the layer to reload tiles
  _setWithoutGenericChangeEvent: function(attr, val) {
    var prevVal = this.get(attr);
    this.set(attr, val, {silent: true});
    if (val !== prevVal) {
      this.trigger('change:' + attr, this, val);
    }
  },

  // Expected to be called from view, to keep the model in sync,
  // so other views can listen to the model w/o have to know what view implementation is used
  initBindsForTorqueLayerView: function(torqueLayerView) {
    window.tlv = torqueLayerView;
    torqueLayerView.bind('play', this._setWithoutGenericChangeEvent.bind(this, 'isRunning', true))
    torqueLayerView.bind('pause', this._setWithoutGenericChangeEvent.bind(this, 'isRunning', false))
    torqueLayerView.bind('change:time', function() {
      this._setWithoutGenericChangeEvent('step', torqueLayerView.getStep());
    }, this);

    torqueLayerView.once('remove', function() {
      torqueLayerView.unbind('play');
      torqueLayerView.unbind('pause');
      torqueLayerView.unbind('change:time');
    });

    this.set({
        isRunning: torqueLayerView.isRunning(),
        timeBounds: torqueLayerView.getTimeBounds(),
        step: torqueLayerView.getStep(),
        steps: torqueLayerView.options.steps
      },
      { silent: true }
    );

    this.play = torqueLayerView.play.bind(torqueLayerView);
    this.pause = torqueLayerView.pause.bind(torqueLayerView);
    this.setStep = torqueLayerView.setStep.bind(torqueLayerView);
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
