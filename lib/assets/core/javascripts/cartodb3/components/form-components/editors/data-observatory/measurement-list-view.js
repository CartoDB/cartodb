var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
var CustomListView = require('../../../custom-list/custom-view');

// This needs to change to include description
var itemListTemplate = require('../../../custom-list/custom-list-item.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var searchTemplate = require('./measurement-list-search.tpl');

var REQUIRED_OPTS = [
  'measurements',
  'filters'
];

module.exports = CoreView.extend({
  events: {
    'click .js-filters': '_onClickFilters'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initCollection();
    this._initBinds();

    this._listView = new CustomListView({
      className: 'DO-Measurements',
      typeLabel: 'measurements',
      showSearch: true,
      searchTemplate: searchTemplate,
      collection: this.collection,
      itemTemplate: itemListTemplate,
      searchPlaceholder: 'Search'
    });
  },

  render: function () {
    this.$el.append(this._listView.render().$el);
    return this;
  },

  _initCollection: function () {
    var filters = _.map(this._filters.getSelected(), function (mdl) {
      return mdl.get('id');
    });
    var measurements = this._measurements.filter(function (mdl) {
      var filter = mdl.get('filter');
      // if filters applied, we look for hits
      // if not, we check if measurement has filter
      return filters.length > 0 ? filter && filters.indexOf(filter.id) >= 0 : filter && filter.id;
    });

    this.collection = new CustomListCollection(_.map(measurements, function (measurement) {
      return measurement.attributes;
    }));
  },

  _onClickFilters: function (e) {
    this.killEvent(e);
    this.trigger('filters', this);
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this._measurements.setSelected(item.get('id'));
  }
});
