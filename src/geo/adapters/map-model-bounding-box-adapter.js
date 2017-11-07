var Model = require('../../core/model');

module.exports = Model.extend({

  initialize: function (map) {
    this._map = map;
    this._map.on('change:view_bounds_ne change:center change:zoom', function () {
      this.trigger('boundsChanged', this.getBounds());
    }.bind(this));
  },

  getBounds: function () {
    var mapBounds = this._map.getViewBounds();
    return {
      west: mapBounds[0][1],
      south: mapBounds[0][0],
      east: mapBounds[1][1],
      north: mapBounds[1][0]
    };
  }

});
