var log = require('../../cdb.log');
var Model = require('../../core/model');

// Map layer, could be tiled or whatever
var MapLayer = Model.extend({

  initialize: function () {
    this.bind('change:type', function () {
      log.error('changing layer type is not allowed, remove it and add a new one instead');
    });
  },

  // PUBLIC API METHODS

  remove: function (opts) {
    opts = opts || {};
    this.trigger('destroy', this, this.collection, opts);
  },

  update: function (attrs, options) {
    options = options || {};

    // TODO: Pick the attributes for the specific type of layer
    // Eg: this.set(_.pick(attrs, this.ATTR_NAMES))
    this.set(attrs, {
      silent: options.silent
    });
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return !!this.get('visible');
  },

  isHidden: function () {
    return !this.isVisible();
  },

  toggle: function () {
    this.set('visible', !this.get('visible'));
  },

  // INTERNAL CartoDB.js METHODS

  setOk: function () {
    this.unset('error');
  },

  setError: function (error) {
    this.set('error', error);
  }
});

module.exports = MapLayer;
