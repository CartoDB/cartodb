var Backbone = require('backbone');
var CustomBaselayerModel = require('../../../../data/custom-baselayer-model');

/**
 * Model to representing a TileJSON endpoint
 * See https://github.com/mapbox/tilejson-spec/tree/master/2.1.0 for details
 */

module.exports = Backbone.Model.extend({

  idAttribute: 'url',

  url: function () {
    return this.get('url');
  },

  // save: function () {
  //   // no-op, obviously no write privileges ;)
  // },

  newTileLayer: function () {
    if (!this._isFetched()) throw new Error('no tiles, have fetch been called and returned a successful resultset?');

    var url = this._urlTemplate();

    var layer = new CustomBaselayerModel({
      urlTemplate: url,
      attribution: this.get('attribution'),
      maxZoom: this.get('maxzoom'),
      minZoom: this.get('minzoom'),
      name: this._name(),
      bounding_boxes: this.get('bounds'),
      tms: this.get('scheme') === 'tms',
      category: 'TileJSON',
      type: 'Tiled'
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  },

  _isFetched: function () {
    return this.get('tiles').length > 0;
  },

  _urlTemplate: function () {
    return this.get('tiles')[0];
  },

  _name: function () {
    return this.get('name') || this.get('description');
  }

});
