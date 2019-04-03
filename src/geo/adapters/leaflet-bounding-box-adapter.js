var _ = require('underscore');
var Model = require('../../core/model');

/**
 * Adapt the Leaflet map to offer unique:
 * - getBounds() function
 * - 'boundsChanged' event
 */
module.exports = Model.extend({

  initialize: function (map) {
    this._map = map;
    this._debouncedTriggerBoundsChanged = _.debounce(this._triggerBoundsChanged, 200);
    this._map.on(
      'move zoom',
      this._debouncedTriggerBoundsChanged,
      this
    );
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
  },

  _triggerBoundsChanged: function () {
    this.trigger('boundsChanged', this.getBounds());
  }
});
