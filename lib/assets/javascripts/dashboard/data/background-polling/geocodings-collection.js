const _ = require('underscore');
const Backbone = require('backbone');
const GeocodingModel = require('./geocoding-model');
const pollTimer = 60000;

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel'
];

/**
 *  Geocodings collection
 *
 *  - Check ongoing geocodings in order to add them
 *  to the collection.
 *
 */

module.exports = Backbone.Collection.extend({
  model: GeocodingModel,

  url: function (method) {
    const version = this._configModel.urlVersion('geocoding', method);
    return `/api/${version}/geocodings`;
  },

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  parse: function (response) {
    _.each(response.geocodings, data => {
      // Check if that geocoding exists...
      const geocodings = this.filter(mdl => mdl.get('id') === data.id);

      if (geocodings.length === 0) {
        this._checkOngoingGeocoding(
          new GeocodingModel(data, { startPollingAutomatically: false })
        );
      }
    });

    return this.models;
  },

  _checkOngoingGeocoding: function (model) {
    if (!this._visModel) {
      // If there is NOT a vis, let's start polling
      // this geocoding model
      this.add(model);
      model.pollCheck();
    } else {
      // If there is a vis, let's check if that
      // geocoding belongs to the visualization
      this.vis.map.layers.each(layer => {
        if (layer.table && layer.table.id === model.get('table_name')) {
          this.add(model);
          model.pollCheck();
        }
      });
    }
  },

  // Public methods

  canGeocode: function () {
    return !this.any(function (model) {
      return model.isOngoing();
    });
  },

  fetchGeocodings: function () {
    this.fetch({
      error: e => this.destroyCheck()
    });
  },

  pollCheck: function (i) {
    if (this.pollTimer) return;

    this.pollTimer = setInterval(() => {
      this.fetchGeocodings();
    }, pollTimer);

    this.fetchGeocodings();
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  failedItems: function () {
    return this.filter(function (item) {
      return item.hasFailed();
    });
  }

});
