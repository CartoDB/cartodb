const Backbone = require('backbone');
const _ = require('underscore');
const GeocodingModelPoller = require('./geocoding-model-poller');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Geocoding model
 *
 */
module.exports = Backbone.Model.extend({
  options: {
    startPollingAutomatically: true
  },

  defaults: {
    kind: '',
    formatter: '',
    table_name: '',
    state: ''
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
    // TODO: Check if we can remove this thing
    _.extend(this.options, options);

    this.poller = new GeocodingModelPoller(this);

    if (this.options.startPollingAutomatically) {
      this._checkModel();
    }
  },

  url: function (method) {
    var version = this._configModel.urlVersion('geocoding', method);

    const base = `/api/${version}/geocodings/`;

    if (this.isNew()) {
      return base;
    }
    return base + this.id;
  },

  setUrlRoot: function (urlRoot) {
    this.urlRoot = urlRoot;
  },

  _initBinds: function () {
    this.bind('change:id', this._checkModel, this);
  },

  _checkModel: function () {
    if (this.get('id')) {
      this.pollCheck();
    } else {
      this._saveModel();
    }
  },

  _saveModel: function () {
    if (this.isNew()) {
      this.save({}, {
        error: () => {
          this.set({
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

  pollCheck: function () {
    this.poller.start();
  },

  destroyCheck: function () {
    this.poller.stop();
  },

  getError: function () {
    return this.get('error');
  },

  hasFailed: function () {
    var state = this.get('state');
    return state === 'failed' || state === 'reset' || state === 'cancelled';
  },

  hasCompleted: function () {
    return this.get('state') === 'finished';
  },

  isOngoing: function () {
    return !this.hasCompleted() && !this.hasFailed();
  },

  cancelGeocoding: function () {
    this.save({ state: 'cancelled' }, { wait: true });
  },

  resetGeocoding: function () {
    this.set('state', 'reset');
  }
});
