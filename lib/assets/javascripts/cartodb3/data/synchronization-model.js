var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var MULTIPLIER = 1.2; // Multiply current interval for this number
var INTERVAL = 1500; // Interval time between poll checkings

/**
 *  Synced table model
 */

module.exports = cdb.core.Model.extend({
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
    var version = this._configModel.urlVersion('synchronizations');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/synchronizations';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;

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
    return !this.isNew();
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
  // TODO: manage table renaming
  }

});
