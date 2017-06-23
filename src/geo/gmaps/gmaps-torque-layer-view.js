require('torque.js');
var _ = require('underscore');
var torque = require('torque.js');
var Backbone = require('backbone');
var GMapsLayerView = require('./gmaps-layer-view');
var TorqueLayerViewBase = require('../torque-layer-view-base');

var GMapsTorqueLayerView = function (layerModel, gmapsMap) {
  GMapsLayerView.call(this, layerModel, gmapsMap);

  torque.GMapsTorqueLayer.call(this, this._initialAttrs(layerModel));

  // TODO: revisit this and use composition like we're doing with Leaflet
  this.setNativeTorqueLayer(this);
};

_.extend(
  GMapsTorqueLayerView.prototype,
  GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  TorqueLayerViewBase,
  {
    addToMap: function () {
      this.setMap(this.gmapsMap);
    },

    remove: function () {
      this.setMap(null);
    },

    onAdd: function () {
      torque.GMapsTorqueLayer.prototype.onAdd.apply(this);
    },

    onTilesLoaded: function () {
      // this.trigger('load');
      Backbone.Events.trigger.call(this, 'load');
    },

    onTilesLoading: function () {
      Backbone.Events.trigger.call(this, 'loading');
    }
  });

module.exports = GMapsTorqueLayerView;
