var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var STATUS = require('./query-base-status');
var MAX_GET_LENGTH = 1024;
var MAX_REPEATED_ERRORS = 3;

module.exports = Backbone.Model.extend({
  initialize: function (attrs, options) {
    this.repeatedErrors = 0;

    this.listenTo(this, 'change:status', this._onStatusChanged);
    this.listenTo(this, 'change:ready', this._onReadyChanged);
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  getStatusValue: function () {
    return this.get('status');
  },

  isInInitialStatus: function () {
    return this.get('status') === STATUS.initial;
  },

  isFetched: function () {
    return this.get('status') === STATUS.fetched;
  },

  isFetching: function () {
    return this.get('status') === STATUS.fetching;
  },

  isErrored: function () {
    return this.get('status') === STATUS.errored;
  },

  isUnavailable: function () {
    return this.get('status') === STATUS.unavailable;
  },

  isDone: function () {
    return this.isFetched() || this.isErrored();
  },

  isInFinalStatus: function () {
    var finalStatuses = [STATUS.unavailable, STATUS.fetched, STATUS.errored];
    return _.contains(finalStatuses, this.get('status'));
  },

  canFetch: function () {
    var hasQuery = this.hasQuery();
    var isReady = this.get('ready');

    return hasQuery && isReady;
  },

  hasQuery: function () {
    return !!this.get('query');
  },

  shouldFetch: function () {
    return this.canFetch() && !this.isFetched() && !this.isFetching() && !this.isErrored();
  },

  resetFetch: function () {
    this.set('status', STATUS.unfetched);
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  hasRepeatedErrors: function () {
    return this.repeatedErrors >= MAX_REPEATED_ERRORS;
  },

  _onStatusChanged: function () {
    if (this.isInFinalStatus()) {
      this.trigger('inFinalStatus');
    }
  },

  _addChangeListener: function () {
    this.bind('change', this._onChange, this);
  },

  _removeChangeListener: function () {
    this.unbind('change', this._onChange, this);
  },

  _httpMethod: function () {
    return this._getSqlApiQueryParam().length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  },

  _incrementRepeatedError: function () {
    this.repeatedErrors++;
  },

  _resetRepeatedError: function () {
    this.repeatedErrors = 0;
  },

  _onReadyChanged: function () {
    if (this.get('ready') && this.shouldFetch()) {
      this.fetch();
    }
  }
});
