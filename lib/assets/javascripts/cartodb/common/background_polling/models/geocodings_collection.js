var Backbone = require('backbone');
var _ = require('underscore');
var pollTimer = 30000;
var GeocodingModel = require('./geocoding_model');

/**
 *  Geocodings collection
 *
 *  If it is fetched, it will add the geocoding
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
  },

  parse: function(r) {
    var self = this;

    if (r.geocodings.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.geocodings, function(id) {

        // Check if that geocoding exists...
        var geocodings = self.filter(
          function(mdl) {
            return mdl.get('id') === id
          }
        );

        if (geocodings.length === 0) {
          self.add(new GeocodingModel({ id: id }, { user: self.user } ));
        }
      });
    }

    return this.models
  },

  canGeocode: function() {
    var ongoingGeocodings = 0;

    this.each(function(m) {
      if (!m.hasFailed() && !m.hasCompleted()) {
        ++ongoingGeocodings
      }
    });

    return ongoingGeocodings === 0;
  },

  pollCheck: function(i) {
    if (this.pollTimer) return;

    var self = this;
    this.pollTimer = setInterval(function() {
      self.fetch();
    }, pollTimer || 2000);

    // Start doing a fetch
    this.fetch();
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
