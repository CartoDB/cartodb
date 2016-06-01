require('torque.js');
var _ = require('underscore');
var torque = require('torque.js');
var Backbone = require('backbone');
var GMapsLayerView = require('./gmaps-layer-view');
var TorqueLayerViewBase = require('../torque-layer-view-base');

var GMapsTorqueLayerView = function (layerModel, gmapsMap) {
  GMapsLayerView.call(this, layerModel, this, gmapsMap);

  torque.GMapsTorqueLayer.call(this, this._initialAttrs(layerModel));

  this._init(layerModel); // available due to this model being extended with torque-layer-base
};

_.extend(
  GMapsTorqueLayerView.prototype,
  GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  TorqueLayerViewBase,
  {
    _update: function () {
      var changed = this.model.changedAttributes();
      if (changed === false) return;

      if ('visible' in changed) {
        this.model.get('visible') ? this.show() : this.hide();
      }

      if ('cartocss' in changed) {
        this.setCartoCSS(this.model.get('cartocss'));
      }

      if ('urls' in changed) {
        // REAL HACK
        this.provider.templateUrl = this.model.get('urls').tiles[0];
        // set meta
        _.extend(this.provider.options, this.model.get('meta'));
        this.model.set(this.model.get('meta'));
        // this needs to be deferred in order to break the infinite loop
        // of setReady changing keys and keys updating the model
        // If we do this in the next iteration 'urls' will not be in changedAttributes
        // so this will not pass through this code
        setTimeout(function () {
          this.provider._setReady(true);
          this._reloadTiles();
        }.bind(this), 0);
      }
    },

    refreshView: function () {
      // TODO: update screen
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
