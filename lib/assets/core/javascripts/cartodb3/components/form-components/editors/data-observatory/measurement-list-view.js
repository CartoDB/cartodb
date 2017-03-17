var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListItemView = require('./measurement-list-item-view');
var itemListTemplate = require('./measurement-list-item.tpl');
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
      typeLabel: _t('components.backbone-forms.data-observatory.dropdown.measurement.type'),
      showSearch: true,
      itemView: CustomListItemView,
      searchTemplate: searchTemplate,
      collection: this.collection,
      itemTemplate: itemListTemplate,
      searchPlaceholder: _t('components.backbone-forms.data-observatory.dropdown.measurement.search')
    });
  },

  render: function () {
    this.$el.append(this._listView.render().$el);
    return this;
  },

  _initCollection: function () {
    var filtersApplied = _.map(this._filters.getSelected(), function (mdl) {
      return mdl.getValue();
    });
    var measurements = this._measurements.filter(function (mdl) {
      var filters = mdl.get('filter');
      // if filters applied, we look for hits
      // if not, we check if measurement has filter
      if (filtersApplied.length > 0) {
        return _.some(filters, function (filter) {
          return filtersApplied.indexOf(filter.id) >= 0;
        });
      } else {
        return filters.length > 0;
      }
    });

    this.collection = new CustomListCollection(_.map(measurements, function (measurement) {
      return measurement.attributes;
    }));
  },

  _onClickFilters: function (e) {
    this.killEvent(e);
    this.trigger('filters');
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this._measurements.setSelected(item.getValue());
  }
});
