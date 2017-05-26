var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var utils = require('../../../../helpers/utils');
var template = require('./measurements-search.tpl');

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
    this._search = _.debounce(this._search, 200);
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _search: function (e) {
    var query = this.$('.js-input-search').val();
    query = utils.sanitizeHtml(query);
    this.model.set('query', query);
  }
});
