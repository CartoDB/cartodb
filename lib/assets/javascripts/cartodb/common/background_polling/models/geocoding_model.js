var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var GeocodingModelPoller = require('./geocoding_model_poller');

/**
 *  Geocoding model
 *
 */
module.exports = cdb.core.Model.extend({

  options: {
    startPollingAutomatically: true
  },

  defaults: {
    kind: '',
    formatter: '',
    table_name: '',
    state: ''
  },

  url: function(method) {
    var version = cdb.config.urlVersion('geocoding', method);

    var base = '/api/' + version + '/geocodings/';
    if (this.isNew()) {
      return base;
    }
    return base + this.id;
  },

  setUrlRoot: function(urlRoot) {
    this.urlRoot = urlRoot;
  },

  initialize: function(opts) {
    var self = this;
    this._initBinds();
    _.extend(this.options, opts);
    this.poller = new GeocodingModelPoller(this);
    if (this.options.startPollingAutomatically) {
      this._checkModel();
    };
  },

  _initBinds: function() {
    this.bind('change:id', this._checkModel, this);
  },

  _checkModel: function() {
    var self = this;

    if (this.get('id')) {
      this.pollCheck();
    } else {
      this._saveModel();
    }
  },

  _saveModel: function() {
    var self = this;
    if (this.isNew()) {
      this.save({}, {
        error: function() {
          self.set({
            state: 'failed',
            error: {
              title: 'Oops, there was a problem',
              description: 'Unfortunately there was an error starting the geocoder'
            }
          });
        }
      });
    }
  },

  pollCheck: function() {
    this.poller.start();
  },

  destroyCheck: function() {
    this.poller.stop();
  },

  getError: function() {
    return this.get('error');
  },

  hasFailed: function() {
    var state = this.get('state');
    return state === "failed" || state === "reset" || state === "cancelled"
  },

  hasCompleted: function() {
    return this.get('state') === "finished"
  },

  isOngoing: function() {
    return !this.hasCompleted() && !this.hasFailed()
  },

  cancelGeocoding: function() {
    this.save({ state: 'cancelled' }, { wait:true });
  },

  resetGeocoding: function() {
    this.set('state', 'reset');
  }
});
