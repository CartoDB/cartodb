var _ = require('underscore');
var LayerModelBase = require('./layer-model-base');

var ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD = ['urlTemplate'];

var TileLayer = LayerModelBase.extend({
  defaults: {
    type: 'Tiled',
    visible: true
  },

  initialize: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};
    if (!options.engine) throw new Error('engine is required');

    this._engine = options.engine;

    this.bind('change', this._onAttributeChanged, this);
  },

  _onAttributeChanged: function () {
    if (_.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, this.hasChanged, this)) {
      this._reload();
    }
  },

  _reload: function () {
    this._engine.reload({
      sourceId: this.get('id')
    });
  }
});

module.exports = TileLayer;
