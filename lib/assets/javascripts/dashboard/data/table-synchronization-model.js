const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Synced table model
 */

module.exports = Backbone.Model.extend({
  _X: 1.2, // Multiply current interval for this number
  _INTERVAL: 1500, // Interval time between poll checkings
  _STATES: ['created', 'failure', 'success', 'syncing', 'queued'],

  defaults: {
    name: '',
    url: '',
    state: '',
    run_at: 0,
    ran_at: 0,
    retried_times: 0,
    interval: 0,
    error_code: 0,
    error_message: '',
    service_name: '',
    service_item_id: '',
    content_guessing: true,
    type_guessing: true
  },

  url: function (method) {
    var version = this._configModel.urlVersion('synchronization', method);

    var base = '/api/' + version + '/synchronizations/';
    if (this.isNew()) {
      return base;
    }
    return base + this.id;
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.bind('destroy', function () {
      this.unset('id');
    });
  },

  toJSON: function () {
    var c = _.clone(this.attributes);

    var d = {
      url: c.url,
      interval: c.interval,
      content_guessing: c.content_guessing,
      type_guessing: c.type_guessing,
      create_vis: c.create_vis
    };

    if (c.type === 'remote') {
      _.extend(d, {
        remote_visualization_id: c.remote_visualization_id,
        create_vis: false,
        value: c.value
      });
    }

    if (c.id !== undefined) {
      d.id = c.id;
    }

    // Comes from a service?
    if (c.service_name) {
      d.service_name = c.service_name;
      d.service_item_id = c.service_item_id;
    }

    return d;
  },

  syncNow: function (callback) {
    $.ajax({
      url: this._configModel.prefixUrl() + this.url() + '/sync_now',
      type: 'PUT'
    }).always(callback);
  },

  // Checks for poll to finish
  pollCheck: function (i) {
    var self = this;
    var interval = this._INTERVAL;

    this.pollTimer = setInterval(request, interval);

    function request () {
      self.destroyCheck();

      self.fetch({
        error: function (m, e) {
          self.set({
            error_message: e.statusText || '',
            state: 'failure'
          });
        }
      });

      interval = interval * self._X;

      self.pollTimer = setInterval(request, interval);
    }
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
  },

  isSync: function () {
    return !this.isNew();
  },

  linkToTable: function (table) {
    var self = this;
    if (table.has('synchronization')) {
      this.set(table.get('synchronization'));
    }

    table.bind('change:synchronization', function () {
      self.set(table.get('synchronization'));
    }, table);

    table.bind('destroy', function destroy () {
      self.unbind(null, null, table);
      self.destroy();
    }, table);
    // TODO: manage table renaming
  }

});
