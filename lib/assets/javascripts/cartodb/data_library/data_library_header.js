var cdb = require('cartodb.js');
var $ = require('jquery');

/**
 * The header map in the data-library page, where the user can filter by country, e.g.:
 */
 module.exports = cdb.core.View.extend({

  className: 'DataLibrary-header',

  initialize: function() {
    _.bindAll(this, '_addGeojsonData');

    this.template_base = cdb.templates.getTemplate('data_library/data_library_header_template');
  },

  events: {
    'click .js-country': '_onClickCountry',
    'click .js-back': '_onClickBack'
  },

  load: function() {
    this.map = L.map('DataLibraryMap', {
      zoomControl: false,
      attributionControl: false
    }).setView([44,-31], 3);

    $.getJSON('https://common-data.cartodb.com/api/v2/sql?q=select+*+from+%22world_borders%22&format=geojson&filename=world_borders')
      .done(this._addGeojsonData);
  },

  _addGeojsonData: function(geojsonData) {
    var _this = this;

    var style = {
      color: '#2E3C43',
      weight: 1,
      opacity: 1,
      fillColor: '#242D32',
      fillOpacity: 1,
    };

    this.layer = L.geoJson(geojsonData, {
      style: style
    }).addTo(this.map);

    this.layer.on('click', function(e) {
      var bbox = e.layer.getBounds();

      _this.layer.eachLayer(function (layer) {
        layer.setStyle({ fillColor : '#242D32' });
      });

      e.layer.setStyle({
        fillColor: '#fff'
      });

      _this._updateBounds([
        bbox._southWest.lng,
        bbox._southWest.lat,
        bbox._northEast.lng,
        bbox._northEast.lat
      ]);
    });
  },

  show: function() {
    this.$el.addClass('is-active');
  },

  hide: function() {
    this.$el.removeClass('is-active');
  },

  _updateBounds: function(bounds) {
    this.model.set('bounds', bounds);
  },

  _onClickCountry: function() {
    this.model.set('show_countries', true);
  },

  _onClickBack: function() {
    this.model.set('bounds', null);

    this.layer.eachLayer(function (layer) {
      layer.setStyle({ fillColor : '#242D32' });
    });
  },

  render: function() {
    this.$el.html(this.template_base({ }));

    return this;
  }

});
