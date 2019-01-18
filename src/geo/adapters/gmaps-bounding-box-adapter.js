/* global google */
var _ = require('underscore');
var Model = require('../../core/model');

/**
 * Adapt the Google Maps map to offer unique:
 * - getBounds() function
 * - 'boundsChanged' event
 */
module.exports = Model.extend({

  initialize: function (map) {
    this._isReady = false;
    this._map = map;
    this._debouncedTriggerBoundsChanged = _.debounce(this._triggerBoundsChanged, 200);

    google.maps.event.addListener(
      this._map,
      'bounds_changed',
      this._debouncedTriggerBoundsChanged.bind(this)
    );
  },

  getBounds: function () {
    if (this._isReady) {
      var mapBounds = this._map.getBounds();
      var sw = mapBounds.getSouthWest();
      var ne = mapBounds.getNorthEast();
      return {
        west: sw.lng(),
        south: sw.lat(),
        east: ne.lng(),
        north: ne.lat()
      };
    }
    return {
      west: 0,
      south: 0,
      east: 0,
      north: 0
    };
  },

  clean: function () {
    google.maps.event.clearListeners(this._map, 'bounds_changed');
  },

  _triggerBoundsChanged: function () {
    this._isReady = true;
    this.trigger('boundsChanged', this.getBounds());
  }
});
