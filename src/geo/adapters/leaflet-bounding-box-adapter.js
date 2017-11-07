var Model = require('../../core/model');

module.exports = Model.extend({

  initialize: function (map) {
    this._map = map;
    this._map.on('move zoom', function () {
      this.trigger('boundsChanged', this.getBounds());
    }.bind(this));
  },

  getBounds: function () {
    var mapBounds = this._map.getBounds();
    var sw = mapBounds.getSouthWest();
    var ne = mapBounds.getNorthEast();
    return {
      west: sw.lng,
      south: sw.lat,
      east: ne.lng,
      north: ne.lat
    };
  },

  clean: function () {
    this._map.off('move zoom');
  }
});
