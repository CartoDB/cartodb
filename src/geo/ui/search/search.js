var _ = require('underscore');
var View = require('../../../core/view');
var MAPZEN = require('../../../geo/geocoder/mapzen-geocoder');
var InfowindowModel = require('../../../geo/ui/infowindow-model');
var Infowindow = require('../../../geo/ui/infowindow-view');
var Geometry = require('../../../geo/geometry');
var template = require('./search_template.tpl');
var infowindowTemplate = require('./search_infowindow_template.tpl');

/**
 *  UI component to place the map in the
 *  location found by the geocoder.
 */
var Search = View.extend({
  className: 'CDB-Search',

  _ZOOM_BY_CATEGORY: {
    'building': 18,
    'postal-area': 15,
    'venue':18,
    'region':8,
    'address':18,
    'country':5,
    'county':8,
    'locality':12,
    'localadmin':11,
    'neighbourhood':15,
    'default': 12
  },

  events: {
    'click .js-toggle': '_onToggleClick',
    'submit .js-form': '_onSubmit',
    'click': '_stopPropagation',
    'dblclick': '_stopPropagation',
    'mousedown': '_stopPropagation'
  },

  options: {
    searchPin: true,
    infowindowWidth: 186,
    infowindowOffset: [30, 30],
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAfCAYAAADXwvzvAAACuklEQVR4Ae3PQ+AsNxzA8e8vo/Xus237vVN9qW3b7qW2bdu2caxt29bu/meSmaTpqW63Pfc7wemTZPh9K/Xv3zhzxIgVrho0aMsLGo2N9o+iuYDwV02E5NJpM7d5fMGC515dMP/7l6dNMc+OGJY9Uq99cVMc33I4LOJXCQBQuXPBglNnDRm0Xa1RAWewP3yL/vJLul99Q/pNm0/b+qsnbLHngXAVgAI4b9KkXWc1m9vV58ykst56lKdMptyokdTKRJUIV1MMTGTgbOTknWABgFo2SSbOjuN9wlgIBrSIJ0yiVG9QUgGxUigRRAlpCQYrBs+A/QClliuXV6ppPVibDPPqi5irL8G+/QY2S3FZhityrLNYBWkAI2G5WTA2nGTthKDTJfP/FH1sCb76nNBa7I8/knba6Eyj8wJjLbk4qlCdAFNClWXKiiL72kGRUkSRhwUuTUm7XTqZ3z3KnMM7QhAFUfiKMZ9OQci+ydFFH32BIsDh8hxjDF2T0y0KtHHUczCg34P3wgesfWhZozstW1R/cJpuohA8dI7cWrSfxqM4gwEOnoJnn4HXBVDHwHnriNr2W3G0I8FEkKufMbjcIw1DC+iCuRw2OBduEYAKDD8drlkGlk6BHwAtIEDioD/QBnsnnHAI7A9YAAAGenwEnPuAd8+DewHcS+CeB3szvL0b7ADE/FWzYf5BCxa9dMvqa7oLll7WbTlsxKkDYRi9dPqhRz743L0PuKtOPMXtutHmm/InKf5Y6Co15Upl8qSCqVajXiEeUTRb6GqNIojoGaLEDwEA6B0KIKL8lH8JBeS/3AgK73qAPfc/tCLiAACUCmyvsJHnphwEAYFStNs/NoHgn2ATWPmlF54b/9GHH/Khn88/+9SywJx/+q0SsKTZbB45d/6CO0aNHnutv3kbYDQg9JAAIRDwF/0EjlkjUi3fkAMAAAAASUVORK5CYII=',
    iconAnchor: [7, 31]
  },

  initialize: function () {
    this.mapView = this.options.mapView;
    this.template = this.options.template || template;
  },

  render: function () {
    this.$el.html(this.template(this.options));
    return this;
  },

  _stopPropagation: function (ev) {
    if (ev) {
      ev.stopPropagation();
    }
  },

  _onSubmit: function (ev) {
    ev.preventDefault();
    var self = this;
    var address = this.$('.js-textInput').val();

    if (!address) {
      return;
    }
    // Remove previous pin without any timeout (0 represents the timeout for
    // the animation)
    this._destroySearchPin(0);
    MAPZEN.geocode(address, function (places) {
      self._onResult(places);
    });
  },

  _onResult: function (places) {
    var position = '';
    var address = this.$('.js-textInput').val();

    if (places && places.length > 0) {
      var location = places[0];
      var validBBox = this._isBBoxValid(location);

      // Get BBox if possible and set bounds
      if (validBBox) {
        var s = parseFloat(location.boundingbox.south);
        var w = parseFloat(location.boundingbox.west);
        var n = parseFloat(location.boundingbox.north);
        var e = parseFloat(location.boundingbox.east);

        var centerLon = (w + e) / 2;
        var centerLat = (s + n) / 2;
        position = [centerLat, centerLon];
        this.model.setBounds([ [ s, w ], [ n, e ] ]);
      }

      // If location is defined,
      // let's store it
      if (location.lat && location.lon) {
        position = [location.lat, location.lon];
      }

      // In the case that BBox is not valid, let's
      // center the map using the position
      if (!validBBox) {
        this.model.setCenter(position);
        this.model.setZoom(this._getZoomByCategory(location.type));
      }

      if (this.options.searchPin) {
        this._createSearchPin(position, address);
      }
    }
  },

  _onToggleClick: function () {
    this.$('.CDB-Search-inner').toggleClass('is-active');
    this.$('.js-textInput').focus();
  },

  // Getting zoom for each type of location
  _getZoomByCategory: function (type) {
    if (type && this._ZOOM_BY_CATEGORY[type]) {
      return this._ZOOM_BY_CATEGORY[type];
    }
    return this._ZOOM_BY_CATEGORY['default'];
  },

  _isBBoxValid: function (location) {
    if (!location.boundingbox || location.boundingbox.south === location.boundingbox.north ||
      location.boundingbox.east === location.boundingbox.west) {
      return false;
    }
    return true;
  },

  _createSearchPin: function (position, address) {
    this._destroySearchPin();
    this._createPin(position, address);
    this._createInfowindow(position, address);
    this._bindEvents();
  },

  _destroySearchPin: function (timeout) {
    this._unbindEvents();
    this._destroyPin();
    this._destroyInfowindow(timeout);
  },

  _createInfowindow: function (position, address) {
    var infowindowModel = new InfowindowModel({
      template: infowindowTemplate,
      latlng: position,
      width: this.options.infowindowWidth,
      offset: this.options.infowindowOffset,
      content: {
        fields: [{
          title: 'address',
          value: address
        }]
      }
    });

    this._searchInfowindow = new Infowindow({
      model: infowindowModel,
      mapView: this.mapView
    });

    this.mapView.$el.append(this._searchInfowindow.el);
    infowindowModel.set('visibility', true);
  },

  _destroyInfowindow: function (timeout) {
    if (this._searchInfowindow) {
      timeout = !_.isUndefined(timeout) && _.isNumber(timeout) ? timeout : 500;
      // Hide it and then destroy it (when animation ends)
      this._searchInfowindow.hide(true);
      var self = this;
      setTimeout(function () {
        if (self._searchInfowindow) {
          self._searchInfowindow.clean();
          delete self._searchInfowindow;
        }
      }, timeout);
    }
  },

  _createPin: function (position, address) {
    this._searchPin = this.mapView._addGeomToMap(
      new Geometry({
        geojson: { type: 'Point', 'coordinates': [position[1], position[0]] },
        iconUrl: this.options.iconUrl,
        iconAnchor: this.options.iconAnchor
      })
    );
  },

  _toggleSearchInfowindow: function () {
    var infowindowVisibility = this._searchInfowindow.model.get('visibility');
    this._searchInfowindow.model.set('visibility', !infowindowVisibility);
  },

  _destroyPin: function () {
    if (this._searchPin) {
      this.mapView._removeGeomFromMap(this._searchPin);
      delete this._searchPin;
    }
  },

  _bindEvents: function () {
    this._searchPin && this._searchPin.bind('click', this._toggleSearchInfowindow, this);
    this.mapView.bind('click', this._destroySearchPin, this);
  },

  _unbindEvents: function () {
    this._searchPin && this._searchPin.unbind('click', this._toggleSearchInfowindow, this);
    this.mapView.unbind('click', this._destroySearchPin, this);
  },

  clean: function () {
    this._unbindEvents();
    this._destroySearchPin();
    View.prototype.clean.call(this);
  }

});

module.exports = Search;
