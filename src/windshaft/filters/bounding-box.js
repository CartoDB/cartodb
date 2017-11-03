var _ = require('underscore');
var Model = require('../../core/model');
var BOUNDING_BOX_FILTER_WAIT = 300;

module.exports = Model.extend({
  initialize: function (map) {
    if (!map) {
      throw new TypeError('Bounding box filter needs a map to get instantiated.');
    }

    this._map = map;
    this.setBounds(this._map.getViewBounds());
    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._map, 'change:view_bounds_ne change:center change:zoom', _.debounce(this._boundsChanged, BOUNDING_BOX_FILTER_WAIT));
  },

  _stopBinds: function () {
    this.stopListening(this._map, 'change:view_bounds_ne change:center change:zoom');
  },

  _boundsChanged: function () {
    this.setBounds(this._map.getViewBounds());
    this.trigger('boundsChanged');
  },

  setBounds: function (bounds) {
    this.set({
      west: bounds[0][1],
      south: bounds[0][0],
      east: bounds[1][1],
      north: bounds[1][0]
    });
  },

  getBounds: function () {
    return [
      this.get('west'),
      this.get('south'),
      this.get('east'),
      this.get('north')
    ];
  },

  areBoundsAvailable: function () {
    return _.isFinite(this.get('west'));
  },

  toString: function () {
    return this.getBounds().join(',');
  }
});
