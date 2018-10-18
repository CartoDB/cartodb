var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var utils = require('builder/helpers/utils');
var template = require('./lazy-search.tpl');

var REQUIRED_OPTS = [
  'model'
];

module.exports = CoreView.extend({
  className: 'CDB-Box-modalHeader',

  events: {
    'input .js-input-search': '_search'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(template());

    // Focus the input when rendered
    setTimeout(function () {
      this._getInput().focus();
    }.bind(this), 100);

    return this;
  },

  _onClickFilters: function (e) {
    this.killEvent(e);
    this.trigger('filters');
  },

  _search: _.debounce(function (e) {
    var query = this._getInput().val();
    query = query.toLowerCase();
    query = utils.sanitizeHtml(query);
    this.model.set('query', query);
  }, 500),

  _getInput: function () {
    return this.$('.js-input-search');
  }
});
