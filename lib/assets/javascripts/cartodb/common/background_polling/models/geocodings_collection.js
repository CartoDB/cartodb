var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var pollTimer = 60000;
var GeocodingModel = require('./geocoding_model');

/**
 *  Geocodings collection
 *
 *  - Check ongoing geocodings in order to add them
 *  to the collection.
 *
 */

module.exports = Backbone.Collection.extend({

  model: GeocodingModel,

  url: function(method) {
    var version = cdb.config.urlVersion('geocoding', method);
    return '/api/' + version + '/geocodings';
  },

  initialize: function(mdls, opts) {
    this.user = opts.user; 
    this.vis = opts.vis;
  },

  parse: function(r) {
    var self = this;

    _.each(r.geocodings, function(data) {

      // Check if that geocoding exists...
      var geocodings = self.filter(
        function(mdl) {
          return mdl.get('id') === data.id
        }
      );

      if (geocodings.length === 0) {
        self._checkOngoingGeocoding(
          new GeocodingModel(data, { startPollingAutomatically: false })
        )
      }
    });

    return this.models
  },

  _checkOngoingGeocoding: function(mdl) {
    if (!this.vis) {
      // If there is NOT a vis, let's start polling
      // this geocoding model
      this.add(mdl);
      mdl.pollCheck();
    } else {
      var self = this;
      // If there is a vis, let's check if that
      // geocoding belongs to the visualization
      this.vis.map.layers.each(function(lyr) {
        if (lyr.table && lyr.table.id === mdl.get('table_name')) {
          self.add(mdl);
          mdl.pollCheck();
        }
      })
    }
  },

  // Public methods

  canGeocode: function() {
    return !this.any(function(m) {
      return m.isOngoing();
    });
  },

  fetchGeocodings: function() {
    var self = this;
    this.fetch({
      error: function(e) {
        self.destroyCheck();
      }
    });
  },

  pollCheck: function(i) {
    if (this.pollTimer) return;

    var self = this;
    this.pollTimer = setInterval(function() {
      self.fetchGeocodings();
    }, pollTimer);

    this.fetchGeocodings();
  },

  destroyCheck: function() {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  failedItems: function() {
    return this.filter(function(item) {
      return item.hasFailed();
    });
  }

});
