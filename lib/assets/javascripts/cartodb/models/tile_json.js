/**
 * Model to representing a TileJSON endpoint
 * See https://github.com/mapbox/tilejson-spec/tree/master/2.1.0 for details
 */
cdb.admin.TileJSON = cdb.core.Model.extend({

  idAttribute: 'url',

  url: function() {
    return this.get('url');
  },

  save: function() {
    // no-op, obviously no write privileges ;)
  },

  newTileLayer: function() {
    if (!this._isFetched()) throw new Error('no tiles, have fetch been called and returned a successful resultset?');

    var layer = new cdb.admin.TileLayer({
      urlTemplate: this._urlTemplate(),
      name: this._name(),
      attribution: this.get('attribution'),
      maxZoom: this.get('maxzoom'),
      minZoom: this.get('minzoom'),
      bounding_boxes: this.get('bounds'),
      tms: this.get('scheme') === 'tms'
    });

    return layer;
  },

  _isFetched: function() {
    return this.get('tiles').length > 0;
  },

  _urlTemplate: function() {
    return this.get('tiles')[0];
  },

  _name: function() {
    return this.get('name') || this.get('description');
  }
});
