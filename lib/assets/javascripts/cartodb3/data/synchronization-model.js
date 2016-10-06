var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var MULTIPLIER = 1.2; // Multiply current interval for this number
var INTERVAL = 1500; // Interval time between poll checkings
var SYNC_GAP = 900000; // Gap (in ms) necessary to perform next synchronization
var POLLING_GAP = 15000; // Gap (in seconds) necessary to start polling and checking synchronization

/**
 *  Synced table model
 */

module.exports = Backbone.Model.extend({
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

  urlRoot: function () {
    var version = this._configModel.urlVersion('synchronizations');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/synchronizations/';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;

    this.bind('destroy', function () {
      this.unset('id');
    });

    this._checkState();

    this.bind('change:error_code change:error_message change:state', this._checkState, this);
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

  _checkState: function () {
    if (this.get('error_code') || this.get('error_message')) {
      this.set('state', 'failure');
    }
  },

  syncNow: function (callback) {
    if (!callback) throw new Error('callback is required');

    $.ajax({
      url: this.url() + '/sync_now',
      type: 'PUT'
    }).always(callback);
  },

  // Checks for poll to finish
  pollCheck: function (i) {
    var self = this;
    var interval = INTERVAL;

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

      interval = interval * MULTIPLIER;

      self.pollTimer = setInterval(request, interval);
    }
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
  },

  isSync: function () {
    return !this.isNew() && this.get('interval') > 0;
  },

  isSyncing: function () {
    return this.get('state') === 'syncing' || this.get('state') === 'queued';
  },

  canSyncNow: function () {
    var ranAt = new Date(this.get('ran_at'));
    var now = new Date();
    var gap = SYNC_GAP; // Importer needs some time to perform the next sync, set 15 min as default.

    if (this.isSyncing()) {
      return false;
    }

    return (now.getTime() - ranAt.getTime()) > gap;
  },

  linkToTable: function (tableModel) {
    var self = this;
    if (tableModel.has('synchronization')) {
      this.set(tableModel.get('synchronization'));
    }

    tableModel.bind('change:synchronization', function () {
      self.set(tableModel.get('synchronization'));
    }, tableModel);

    tableModel.bind('destroy', function destroy () {
      self.unbind(null, null, tableModel);
      self.destroy();
    }, tableModel);
  }
}, {
  SYNC_GAP: SYNC_GAP,
  POLLING_GAP: POLLING_GAP
});
