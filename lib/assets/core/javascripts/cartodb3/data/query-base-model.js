var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var STATUS = require('./query-base-status');
var MAX_GET_LENGTH = 1024;
var MAX_REPEATED_ERRORS = 3;

module.exports = Backbone.Model.extend({
  initialize: function (attrs, options) {
    this.threshold = new Backbone.Model({
      repeatedErrors: 0
    });
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

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

  canFetch: function () {
    return this.hasQuery() && this.get('ready');
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
    return this.threshold.get('repeatedErrors') >= MAX_REPEATED_ERRORS;
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
    var repeatedErrors = this.threshold.get('repeatedErrors');
    this.threshold.set('repeatedErrors', repeatedErrors + 1);
  },

  _resetRepeatedError: function () {
    this.threshold.set('repeatedErrors', 0);
  }
});
