var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

/**
 * The header map in the data-library page, where the user can filter by country, e.g.:
 */
 module.exports = cdb.core.View.extend({

  className: 'DataLibrary-header',

  initialize: function() {
    _.bindAll(this, '_addGeojsonData');

    this.ACTIVE_CARTODB_ID = null;

    this.template_base = cdb.templates.getTemplate('data_library/header/template');

    this._initBindings();
  },

  events: {
    'click .js-country': '_onClickCountry',
    'click .js-back': '_onClickBack'
  },

  _initBindings: function() {
    var self = this;

    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:vis_count', this._onChangeVisCount, this);
    this.model.bind('change:show_countries', this._onChangeCountries, this);
  },

  load: function() {
    this.map = L.map(this.$("#DataLibraryMap")[0], {
      zoomControl: false,
      attributionControl: false
    }).setView([44,-31], 3);

    var sqlDomain = cdb.config.get('sql_api_template').replace('{user}', cdb.config.get('data_library_user'));
    var geojsonURL = sqlDomain + '/api/v2/sql?q=' + encodeURIComponent("select * from world_borders") + '&format=geojson&filename=world_borders';
    $.getJSON(geojsonURL).done(this._addGeojsonData);
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
      style: style,
      onEachFeature: function(feature, featureLayer) {
        featureLayer
          .on('click', function (e) {
            if (feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) {
              _this._onClickFeature(feature, featureLayer, e.layer);
            }
          })
          .on('mouseover', function (e) {
            _this._onMouseOverFeature(featureLayer, e.target);
          })
          .on('mouseout', function () {
            _this._onMouseOutFeature();
          });
      }
    }).addTo(this.map);
  },

  _onClickFeature: function(feature, featureLayer, eventLayer) {
    this.ACTIVE_CARTODB_ID = feature.properties.cartodb_id;

    this.layer.eachLayer(function (layer) {
      layer.setStyle({ fillColor : '#242D32' });
    });

    featureLayer.setStyle({
      fillColor: '#fff'
    });

    var bbox = eventLayer.getBounds();

    this.map.fitBounds(bbox);

    this._updateBounds([
      bbox._southWest.lng,
      bbox._southWest.lat,
      bbox._northEast.lng,
      bbox._northEast.lat
    ]);
  },

  _onMouseOverFeature: function(featureLayer, target) {
    var _this = this;

    this.layer.eachLayer(function (layer) {
      if (layer.feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) {
        layer.setStyle({ fillColor : '#242D32' });
      }
    });

    if (target.feature.properties.cartodb_id != this.ACTIVE_CARTODB_ID) {
      featureLayer.setStyle({ fillColor : '#616567' });
    }
  },

  _onMouseOutFeature: function() {
    var _this = this;

    this.layer.eachLayer(function (layer) {
      if (layer.feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) {
        layer.setStyle({ fillColor : '#242D32' });
      }
    });
  },

  show: function() {
    $('.js-Header-title').removeClass('is-hidden');
    $('.js-Header-footer').removeClass('is-hidden');
    this.$el.addClass('is-active');
  },

  hide: function() {
    $('.js-Header-title').addClass('is-hidden');
    $('.js-Header-footer').addClass('is-hidden');

    this.$el.removeClass('is-active');
  },

  _updateBounds: function(bounds) {
    this.collection.options.set({
      bbox: bounds.join(','),
      page: 1
    });

  },

  _onClickCountry: function() {
    this.model.set('show_countries', true);
  },

  _onClickBack: function() {
    this.model.set('show_countries', false);
    this.ACTIVE_CARTODB_ID = null;
    this.collection.options.set({
      bbox: '',
      page: 1
    });

    this.map.setView([44,-31], 3);

    this.layer.eachLayer(function (layer) {
      layer.setStyle({ fillColor : '#242D32' });
    });
  },

  render: function() {
    this.$el.html(this.template_base({ }));

    return this;
  },

  _onChangeCountries: function() {
    this.$('.js-Header-title').toggleClass('is-hidden', this.model.get('show_countries'));
    this.$('.js-CountrySelector').toggleClass('is-hidden', this.model.get('show_countries'));
    this.$('.js-CountrySelector-back').toggleClass('is-hidden', !this.model.get('show_countries'));
    this.$el.toggleClass('is-active', this.model.get('show_countries'));
  }

});
