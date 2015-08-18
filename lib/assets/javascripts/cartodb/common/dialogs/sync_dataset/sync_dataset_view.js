var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var IntervalView = require('./interval_view');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Sync modal
 */
module.exports = BaseDialog.extend({

  _INTERVALS: [
    ['Every hour', (60*60)],
    ['Every day', (60*60*24)],
    ['Every week', (60*60*24*7)],
    ['Every month', (60*60*24*30)],
    ['Never', 0]
  ],

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
    if (this.table.synchronization.get('service_name') || this.table.synchronization.get('service_item_id')) {
      return this.table.synchronization.get('service_item_id');
    }
  },

  _serviceName: function() {
    var name = this.table.synchronization.get('service_name');
    if (name && _.isString(name)) {
      return cdb.Utils.capitalize(name);
    }
  },

  _initIntervals: function() {
    this._intervals = new Backbone.Collection();

    _.each(this._INTERVALS, function(interval) {
      this._intervals.add({ name: interval[0], interval: interval[1], checked: this.table.synchronization.get("interval") === interval[1] });
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

  _ok: function() {
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
