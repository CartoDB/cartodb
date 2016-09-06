var _ = require('underscore');
var Backbone = require('backbone');
var LayerLegendsView = require('./layer-legends-view');

var LegendsView = Backbone.View.extend({

  className: 'CDB-Legends',

  initialize: function (deps) {
    if (!deps.layerModels) throw new Error('layerModels is required');

    // TODO: When layers are re-ordered -> Re-order legends
    // TODO: Reverse layers
    // TODO: What if new layers are added?
    // TODO: When a layer is removed -> remove it's legends (clean)
    this._layerModels = deps.layerModels;
  },

  render: function () {
    _.each(this._layerModels, this._renderLayerLegends, this);
    return this;
  },

  _renderLayerLegends: function (layerModel) {
    var layerLegendsView = new LayerLegendsView({ model: layerModel });
    this.$el.append(layerLegendsView.render().$el);
  }
});

module.exports = LegendsView;
