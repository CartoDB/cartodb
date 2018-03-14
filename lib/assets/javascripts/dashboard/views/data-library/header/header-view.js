const CoreView = require('backbone/core-view');
const $ = require('jquery');
const _ = require('underscore');
const L = require('leaflet');
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

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    _.bindAll(this, '_addGeojsonData');
  },

  render: function () {
    this.$el.html(template());

    return this;
  },

  load: function () {
    this.map = L.map(this.$('#DataLibraryMap')[0], {
      zoomControl: false,
      attributionControl: false
    }).setView([44, -31], 3);

    var sqlDomain = this._configModel.get('sql_api_template').replace('{user}', this._configModel.get('common_data_user'));
    var geojsonURL = sqlDomain + '/api/v2/sql?q=' + encodeURIComponent('select * from world_borders') + '&format=geojson&filename=world_borders';

    $.getJSON(geojsonURL).done(this._addGeojsonData);
  },

  _addGeojsonData: function (geojsonData) {
    var style = {
      color: '#2E3C43',
      weight: 1,
      opacity: 1,
      fillColor: '#242D32',
      fillOpacity: 1
    };

    this.layer = L.geoJson(geojsonData, { style: style }).addTo(this.map);
  }
});
