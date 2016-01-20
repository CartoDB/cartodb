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
      changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
      if ('query' in changed || 'query_wrapper' in changed) {
        this.setSQL(this._getQuery(this.model));
      }
      if ('visible' in changed) {
        this.model.get('visible') ? this.show() : this.hide();
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
