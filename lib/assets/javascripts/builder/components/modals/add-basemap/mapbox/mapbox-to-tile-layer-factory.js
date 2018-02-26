/* global Image, location */

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

/**
 * Factory to create a CustomBaselayerModel from a given Integration URL for Mapbox.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    url: ''
  },

  _MAPBOX: {
    version: 4,
    https: 'https://dnv9my2eseobd.cloudfront.net',
    base: 'https://a.tiles.mapbox.com/'
  },

  /**
   * @param {Object} callbacks
   *   success {Function} given a new TileLayer object
   *   error {Function} given an error explanation
   */
  createTileLayer: function (callbacks) {
    var val = this.get('url');
    var url = this._lowerXYZ(val);
    var type = 'json';
    var subdomains = ['a', 'b', 'c'];
    var mapbox_id;

    // Detects the URL's type
    if (url.indexOf('{x}') < 0 && url.indexOf('tiles.mapbox.com') !== -1) {
      mapbox_id = this._getMapBoxMapID(url);
      if (mapbox_id) {
        type = 'mapbox_id';
        url = mapbox_id;
      }
    } else if (url.indexOf('{x}') !== -1) {
      type = 'xyz';
      url = url.replace(/\{s\}/g, function () {
        return subdomains[Math.floor(Math.random() * 3)];
      })
        .replace(/\{x\}/g, '0')
        .replace(/\{y\}/g, '0')
        .replace(/\{z\}/g, '0');
    } else if (url && url.indexOf('http') < 0 && url.match(/(.*?)\.(.*)/) != null && url.match(/(.*?)\.(.*)/).length === 3) {
      type = 'mapbox_id';
      mapbox_id = val;
    } else { // If not, check https
      url = this._fixHTTPS(url);
    }

    var self = this;
    var image;
    if (type === 'mapbox') {
      callbacks.success(this._newTileLayer({ tiles: [url] }));
    } else if (type === 'xyz') {
      image = new Image();
      image.onload = function () {
        callbacks.success(self._newTileLayer({
          tiles: [self._lowerXYZ(val)]
        }));
      };
      image.onerror = function () {
        callbacks.error(self._errorToMsg());
      };
      image.src = url;
    } else if (type === 'mapbox_id') {
      var base_url = this._MAPBOX.base + 'v' + this._MAPBOX.version + '/' + mapbox_id;
      var tile_url = base_url + '/{z}/{x}/{y}.png';
      var json_url = base_url + '.json';

      // JQuery has a faulty implementation of the getJSON method and doesn't return
      // a 404, so we use a timeout. TODO: replace with CORS
      var errorTimeout = setTimeout(function () {
        callbacks.error(self._errorToMsg());
      }, 5000);

      $.ajax({
        url: json_url,
        success: function (data) {
          clearTimeout(errorTimeout);
          callbacks.success(self._newTileLayer({
            tiles: [tile_url],
            attribution: data.attribution,
            minzoom: data.minzoom,
            maxzoom: data.maxzoom,
            name: data.name
          }));
        },
        error: function (e) {
          clearTimeout(errorTimeout);
          callbacks.error(self._errorToMsg(e));
        }
      });
    } else {
      callbacks.error(this._errorToMsg());
    }
  },

  _newTileLayer: function (data) {
    // Check if the respond is an array
    // In that case, get only the first
    if (_.isArray(data) && _.size(data) > 0) {
      data = _.first(data);
    }

    var url = data.tiles[0];
    var attribution = data.attribution || null;

    var layer = new CustomBaselayerModel({
      urlTemplate: url,
      attribution: attribution,
      maxZoom: data.maxzoom || 21,
      minZoom: data.minzoom || 0,
      name: data.name || '',
      category: 'Mapbox',
      type: 'Tiled'
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  },

  _errorToMsg: function (error) {
    if (typeof error === 'object' || !error) {
      if (error && error.status && error.status === 401) {
        return _t('components.modals.add-basemap.mapbox.error');
      } else {
        return _t('components.modals.add-basemap.mapbox.invalid');
      }
    }

    return error;
  },

  _lowerXYZ: function (url) {
    return url.replace(/\{S\}/g, '{s}')
      .replace(/\{X\}/g, '{x}')
      .replace(/\{Y\}/g, '{y}')
      .replace(/\{Z\}/g, '{z}');
  },

  // Extracts the Mapbox MapId from a Mapbox URL
  _getMapBoxMapID: function (url) {
    // http://d.tiles.mapbox.com/v3/{user}.{map}/3/4/3.png
    // http://a.tiles.mapbox.com/v3/{user}.{map}/page.html
    // http://a.tiles.mapbox.com/v4/{user}.{map}.*
    var reg1 = /https?:\/\/[a-z]?\.?tiles\.mapbox.com\/v(\d)\/([^\/.]*)\.([^\/.]*)/;

    // https://tiles.mapbox.com/{user}/edit/{map}?newmap&preset=Streets#3/0.00/-0.09
    var reg2 = /https?:\/\/tiles\.mapbox\.com\/(.*?)\/edit\/(.*?)(\?|#)/;

    var match = '';

    // Check first expresion
    match = url.match(reg1);

    if (match && match[1] && match[2]) {
      return match[2] + '.' + match[3];
    }

    // Check second expresion
    match = url.match(reg2);

    if (match && match[1] && match[2]) {
      return match[1] + '.' + match[2];
    }
  },

  /**
   * return a https url if the current application is loaded from https
   */
  _fixHTTPS: function (url, loc) {
    loc = loc || location;

    // fix the url to https or http
    if (url.indexOf('https') !== 0 && loc.protocol === 'https:') {
      // search for mapping
      var i = url.indexOf('mapbox.com');
      if (i !== -1) {
        return this._MAPBOX.https + url.substr(i + 'mapbox.com'.length);
      }
      return url.replace(/http/, 'https');
    }
    return url;
  }

});
