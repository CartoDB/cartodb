var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var IntervalView = require('./interval_view');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Sync modal
 */
module.exports = BaseDialog.extend({

  _INTERVALS: [
    { name: 'Every hour', time: 60 * 60, type: 'hourly', if_external_source: false },
    { name: 'Every day', time: 60 * 60 * 24, type: 'daily', if_external_source: false },
    { name: 'Every week', time: 60 * 60 * 24 * 7, type: 'weekly', if_external_source: false },
    { name: 'Every month', time: 60 * 60 * 24 * 30, type: 'monthly', if_external_source: true },
    { name: 'Never', time: 0, type: 'never', if_external_source: true }
  ],

  events: {
    'click .js-cancel': '_cancel',
    'click .js-confirm': '_ok'
  },

  initialize: function() {
    if (!this.options.table) {
      throw new TypeError('table is required');
    }
    this.elder('initialize');

    this.model = new cdb.core.Model({
      option: 'interval',
      state: 'prefetching',
      wait: true // await ack before changing model
    });
    this.table = this.options.table;

    this._initBinds();

    // Prefetch
    this.table.fetch({
      success: this._onFetchedTable.bind(this),
      error: this._setterForDefaultErrorState()
    });
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this._initIntervals();
    return this;
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    switch (this.model.get('state')) {
      case 'prefetching':
        return this._renderLoading('Checking synchronization');
      case 'error':
        return this.getTemplate('common/templates/fail')({ msg: '' });
      case 'saving':
        return this._renderLoading('Saving…');
      default:
        return this.getTemplate('common/dialogs/sync_dataset/sync_dataset')({
          service: this._serviceName(),
          url: this._serviceURL()
        });
    }
  },

  _onFetchedTable: function() {
    this.model.set({
      state: 'idle',
      interval: this.table.synchronization.get('interval')
    });
  },

  _renderLoading: function(title) {
    return this.getTemplate('common/templates/loading')({
      title: title,
      quote: randomQuote()
    });
  },

  _serviceURL: function() {
    // Does it come from a datasource service (Dropbox, GDrive, ...)?
    const serviceName = this.table.synchronization.get('service_name');
    const serviceItemId = this.table.synchronization.get('service_item_id');
    if (serviceName || serviceItemId) {
      // In DO, it returns the JSON config in the ID field.
      try {
        return JSON.stringify(JSON.parse(serviceItemId), null, 4);
      } catch (e) { }
      return serviceItemId;
    }
    return this.table.synchronization.get('url');
  },

  _serviceName: function() {
    var name = this.table.synchronization.get('service_name');
    if (name && _.isString(name)) {
      return cdb.Utils.capitalize(name);
    }
  },

  _initIntervals: function() {
    this._intervals = new Backbone.Collection();

    var fromExternalSource = this.table.synchronization.from_external_source;

    _.each(this._INTERVALS, function(interval) {
      var disabled = fromExternalSource && !interval.if_external_source;

      this._intervals.add({
        name: interval.name,
        interval: interval.time,
        checked: this.table.synchronization.get("interval") === interval.time,
        disabled: disabled
      });
    }, this);

    this._intervals.each(function(interval) {
      var view = new IntervalView({ model: interval });
      view.bind("checked", this._onIntervalChecked, this);
      this.$(".js-intervals").append(view.render().$el);
      this.addView(view);
    }, this);
  },

  _onIntervalChecked: function(interval) {
    this._intervals.each(function(i) {
      if (interval.get("interval") !== i.get("interval")) {
        i.set("checked", false);
      }
    }, this);
  },

  _getSelectedInterval: function() {
    return this._intervals.find(function(interval) {
      return interval.get("checked")
    });
  },

  _addTab: function(name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  },

  ok: function() {
    var selectedInterval = this._getSelectedInterval();

    if (selectedInterval) {
      this.model.set('state', 'saving');
      var callbacks = {
        success: this.close.bind(this),
        error: this._setterForDefaultErrorState()
      };

      var interval = selectedInterval.get('interval');
      if (interval) {
        this.table.synchronization.save({
          interval: interval
        }, callbacks);
      } else {
        this.table.synchronization.destroy(callbacks);
      }
    } else {
      this.close();
    }
  },

  _setterForDefaultErrorState: function() {
    return this.model.set.bind(this.model, 'state', 'error');
  }

});
