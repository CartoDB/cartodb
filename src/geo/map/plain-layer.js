var _ = require('underscore');
var LayerModelBase = require('./layer-model-base');

var ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD = ['color', 'image'];

/**
 * this layer allows to put a plain color or image as layer (instead of tiles)
 */
var PlainLayer = LayerModelBase.extend({
  defaults: {
    type: 'Plain',
    visible: true,
    baseType: 'plain',
    className: 'plain',
    color: '#FFFFFF',
    image: ''
  },

  initialize: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};
    if (!options.vis) throw new Error('vis is required');

    this._vis = options.vis;

    this.bind('change', this._onAttributeChanged, this);
  },

  _onAttributeChanged: function () {
    if (_.any(ATTRIBUTES_THAT_TRIGGER_VIS_RELOAD, this.hasChanged, this)) {
      this._reloadVis();
    }
  },

  _reloadVis: function () {
    this._vis.reload({
      sourceId: this.get('id')
    });
  }
});

module.exports = PlainLayer;
