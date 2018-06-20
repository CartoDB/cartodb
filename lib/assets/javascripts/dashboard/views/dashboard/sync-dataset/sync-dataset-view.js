const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const IntervalView = require('dashboard/views/dashboard/sync-dataset/interval-view');
const template = require('./sync-dataset.tpl');
const loadingView = require('builder/components/loading/render-loading');
const failTemplate = require('dashboard/components/fail.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'table',
  'modalModel'
];

/**
 * Sync modal
 */
module.exports = CoreView.extend({

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

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      option: 'interval',
      state: 'prefetching',
      wait: true // await ack before changing model
    });

    this._initBinds();

    // Prefetch
    this._table.fetch({
      success: this._onFetchedTable.bind(this),
      error: this._setterForDefaultErrorState()
    });
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:state', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.render_content());
    this._initIntervals();

    return this;
  },

  render_content: function () {
    switch (this.model.get('state')) {
      case 'prefetching':
        return this._renderLoading('Checking synchronization');
      case 'error':
        return failTemplate({ msg: '' });
      case 'saving':
        return this._renderLoading('Saving…');
      default:
        return template({
          service: this._serviceName(),
          url: this._serviceURL()
        });
    }
  },

  _onFetchedTable: function () {
    this.model.set({
      state: 'idle',
      interval: this._table.synchronization.get('interval')
    });
  },

  _renderLoading: function (title) {
    return loadingView({ title });
  },

  _serviceURL: function () {
    // Does it come from a datasource service (Dropbox, GDrive, ...)?
    if (this._table.synchronization.get('service_name') || this._table.synchronization.get('service_item_id')) {
      return this._table.synchronization.get('service_item_id');
    }
    return this._table.synchronization.get('url');
  },

  _serviceName: function () {
    const name = this._table.synchronization.get('service_name');

    if (name && _.isString(name)) {
      return Utils.capitalize(name);
    }
  },

  _initIntervals: function () {
    this._intervals = new Backbone.Collection();

    const fromExternalSource = this._table.synchronization.from_external_source;

    _.each(this._INTERVALS, interval => {
      const disabled = fromExternalSource && !interval.if_external_source;

      this._intervals.add({
        name: interval.name,
        interval: interval.time,
        checked: this._table.synchronization.get('interval') === interval.time,
        disabled
      });
    });

    this._intervals.each(interval => {
      const view = new IntervalView({ model: interval });
      view.bind('checked', this._onIntervalChecked, this);

      this.$('.js-intervals').append(view.render().$el);
      this.addView(view);
    });
  },

  _onIntervalChecked: function (interval) {
    this._intervals.each(function (index) {
      if (interval.get('interval') !== index.get('interval')) {
        index.set('checked', false);
      }
    });
  },

  _getSelectedInterval: function () {
    return this._intervals.find(interval => interval.get('checked'));
  },

  _addTab: function (name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  },

  _ok: function () {
    const selectedInterval = this._getSelectedInterval();

    if (selectedInterval) {
      this.model.set('state', 'saving');
      const callbacks = {
        success: () => this._modalModel.destroy(),
        error: this._setterForDefaultErrorState()
      };

      const interval = selectedInterval.get('interval');

      if (interval) {
        this._table.synchronization.save({
          interval: interval
        }, callbacks);
      } else {
        this._table.synchronization.destroy(callbacks);
      }
    } else {
      this._modalModel.destroy();
    }
  },

  _setterForDefaultErrorState: function () {
    return this.model.set.bind(this.model, 'state', 'error');
  },

  _cancel: function () {
    this._modalModel.destroy();
  }

});
