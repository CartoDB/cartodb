var _ = require('underscore');
var Model = require('../../core/model');
var BOUNDING_BOX_FILTER_WAIT = 350;

module.exports = Model.extend({
  initialize: function (mapAdapter) {
    this._bounds = {};

    if (mapAdapter) {
      this._mapAdapter = mapAdapter;
      this.setBounds(this._mapAdapter.getBounds());
      this._initBinds();
    }
  },

  _initBinds: function () {
    this.listenTo(this._mapAdapter, 'boundsChanged', _.debounce(this._boundsChanged, BOUNDING_BOX_FILTER_WAIT));
  },

  _stopBinds: function () {
    if (this._mapAdapter) {
      this.stopListening(this._mapAdapter, 'boundsChanged');
    }
  },

  _boundsChanged: function (bounds) {
    this.setBounds(bounds);
  },

  setBounds: function (bounds) {
    this._bounds = bounds;
    this.trigger('boundsChanged', bounds);
  },

  getBounds: function () {
    return this._bounds;
  },

  areBoundsAvailable: function () {
    return _.isFinite(this._bounds.west);
  },

  serialize: function () {
    return [
      this._bounds.west,
      this._bounds.south,
      this._bounds.east,
      this._bounds.north
    ].join(',');
  },

  clean: function () {
    this._stopBinds();
  }
});
