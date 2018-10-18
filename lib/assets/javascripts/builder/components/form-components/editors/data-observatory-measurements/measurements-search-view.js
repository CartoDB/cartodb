var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var utils = require('builder/helpers/utils');
var template = require('./measurements-search.tpl');

var REQUIRED_OPTS = [
  'model',
  'filtersCollection'
];

module.exports = CoreView.extend({
  className: 'CDB-Box-modalHeader',

  events: {
    'input .js-input-search': '_search',
    'click .js-filters': '_onClickFilters'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    var label = this._getSearchLabel();
    this.$el.html(template({
      label: label
    }));

    // Focus the input when rendered
    setTimeout(function () {
      this._getInput().focus();
    }.bind(this), 100);

    return this;
  },

  _getSearchLabel: function () {
    var selectedFilters = this._filtersCollection.getSelected().length;
    var label = _t('analyses.data-observatory-measure.filters.label');
    if (selectedFilters === 1) {
      label = _t('analyses.data-observatory-measure.filters.applied.single');
    } else if (selectedFilters > 1) {
      label = _t('analyses.data-observatory-measure.filters.applied.multiple', {
        filters: selectedFilters
      });
    }

    return label;
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
