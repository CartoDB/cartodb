const CoreView = require('backbone/core-view');
const $ = require('jquery');
const _ = require('underscore');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./header.tpl');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * The header map in the data-library page, where the user can filter by country, e.g.:
 */
module.exports = CoreView.extend({

  className: 'DataLibrary-header',

  events: {
    'click .js-country': '_onClickCountry',
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    _.bindAll(this, '_addGeojsonData');

    this.ACTIVE_CARTODB_ID = null;

    this._initBindings();
  },

  render: function () {
    this.$el.html(template());

    return this;
  },

  _initBindings: function () {
    this.listenTo(this.model, 'change:show_more', this._onChangeShowMore);
    this.listenTo(this.model, 'change:vis_count', this._onChangeVisCount);
    this.listenTo(this.model, 'change:show_countries', this._onChangeCountries);
  },

  load: function () {
    // TODO: This is not working
    this.map = L.map(this.$('#DataLibraryMap')[0], {
      zoomControl: false,
      attributionControl: false
    }).setView([44, -31], 3);

    var sqlDomain = this._configModel.get('sql_api_template').replace('{user}', this._configModel.get('common_data_user'));
    var geojsonURL = sqlDomain + '/api/v2/sql?q=' + encodeURIComponent('select * from world_borders') + '&format=geojson&filename=world_borders';
    $.getJSON(geojsonURL).done(this._addGeojsonData);
  },

  _addGeojsonData: function (geojsonData) {
    var _this = this;

    var style = {
      color: '#2E3C43',
      weight: 1,
      opacity: 1,
      fillColor: '#242D32',
      fillOpacity: 1
    };

    this.layer = L.geoJson(geojsonData, {
      style: style,
      onEachFeature: function (feature, featureLayer) {
        featureLayer
          .on('click', function (e) {
            if (feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) { // eslint-disable-line
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

  _onClickFeature: function (feature, featureLayer, eventLayer) {
    this.ACTIVE_CARTODB_ID = feature.properties.cartodb_id;

    this.layer.eachLayer(function (layer) {
      layer.setStyle({ fillColor: '#242D32' });
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

  _onMouseOverFeature: function (featureLayer, target) {
    var _this = this;

    this.layer.eachLayer(function (layer) {
      if (layer.feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) { // eslint-disable-line
        layer.setStyle({ fillColor: '#242D32' });
      }
    });

    if (target.feature.properties.cartodb_id != this.ACTIVE_CARTODB_ID) { // eslint-disable-line
      featureLayer.setStyle({ fillColor: '#616567' });
    }
  },

  _onMouseOutFeature: function () {
    var _this = this;

    this.layer.eachLayer(function (layer) {
      if (layer.feature.properties.cartodb_id != _this.ACTIVE_CARTODB_ID) { // eslint-disable-line
        layer.setStyle({ fillColor: '#242D32' });
      }
    });
  },

  show: function () {
    $('.js-Header-title').removeClass('is-hidden');
    $('.js-Header-footer').removeClass('is-hidden');
    this.$el.addClass('is-active');
  },

  hide: function () {
    $('.js-Header-title').addClass('is-hidden');
    $('.js-Header-footer').addClass('is-hidden');

    this.$el.removeClass('is-active');
  },

  _updateBounds: function (bounds) {
    this.collection.options.set({
      bbox: bounds.join(','),
      page: 1
    });
  },

  _onClickCountry: function () {
    this.model.set('show_countries', true);
  },

  _onClickBack: function () {
    this.model.set('show_countries', false);
    this.ACTIVE_CARTODB_ID = null;
    this.collection.options.set({
      bbox: '',
      page: 1
    });

    this.map.setView([44, -31], 3);

    this.layer.eachLayer(function (layer) {
      layer.setStyle({ fillColor: '#242D32' });
    });
  },

  _onChangeCountries: function () {
    this.$('.js-Header-title').toggleClass('is-hidden', this.model.get('show_countries'));
    this.$('.js-CountrySelector').toggleClass('is-hidden', this.model.get('show_countries'));
    this.$('.js-CountrySelector-back').toggleClass('is-hidden', !this.model.get('show_countries'));
    this.$el.toggleClass('is-active', this.model.get('show_countries'));
  }

});
