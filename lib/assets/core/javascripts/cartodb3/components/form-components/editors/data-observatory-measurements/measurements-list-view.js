var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListItemView = require('./measurement-list-item-view');
var itemListTemplate = require('./measurement-list-item.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var template = require('./measurements-list.tpl');
var SearchMeasurementView = require('./measurements-search-view');
var CountMeasurementView = require('./measurements-count-view');
var statusTemplate = require('./list-view-states.tpl');

var REQUIRED_OPTS = [
  'measurementsCollection'
];

module.exports = CoreView.extend({
  options: {
    maxItems: 100
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      query: '',
      items: this.options.maxItems
    });

    this._initBinds();
    // this._filterResults('');
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template());
    this._createSearchView();
    this._createCountView();
    this._renderListSection();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._measurementsCollection.stateModel, 'change:state', this._renderListSection);
  },

  // _filteredCollection: function () {
  //   var filtersApplied = _.map(this._filtersCollection.getSelected(), function (mdl) {
  //     return mdl.getValue();
  //   });

  //   return this._measurementsCollection.filter(function (mdl) {
  //     var filters = mdl.get('filter');
  //     // if filters applied, we look for hits
  //     // if not, we check if measurement has filter
  //     if (filtersApplied.length > 0) {
  //       return _.some(filters, function (filter) {
  //         return filtersApplied.indexOf(filter.id) >= 0;
  //       });
  //     } else {
  //       return filters.length > 0;
  //     }
  //   });
  // },

  _createListView: function () {
    if (this._listView) {
      this._listView.clean();
      this.removeView(this._listView);
    }

    this._listView = new CustomListView({
      className: 'DO-Measurements',
      typeLabel: _t('components.backbone-forms.data-observatory.dropdown.measurement.type'),
      showSearch: false,
      itemView: CustomListItemView,
      collection: this._measurementsCollection,
      itemTemplate: itemListTemplate
    });

    this.addView(this._listView);
    this._listView.show();
    this.$('.js-list').html(this._listView.$el);
  },

  _createStatusView: function (status) {
    var el = statusTemplate({
      status: status
    });

    this.$('.js-list').html(el);
  },

  _renderListSection: function () {
    var status = this._measurementsCollection.stateModel.get('state');

    if (status === 'fetched') {
      this._createListView();
    } else {
      this._createStatusView(status);
    }
  },

  _createSearchView: function () {
    this._searchView = new SearchMeasurementView({
      model: this.model
    });
    this.addView(this._searchView);
    this.$('.js-search').append(this._searchView.render().el);

    this.listenTo(this._searchView, 'filters', this._onClickFilters);
  },

  _onClickFilters: function (e) {
    this.killEvent(e);
    this.trigger('filters');
  },

  _createCountView: function () {
    var view = new CountMeasurementView({
      model: this.model
    });
    this.addView(view);
    this.$('.js-count').append(view.render().el);
  },

  // _showResults: function (keyword) {
  //   this._filterResults(keyword);
  //   this._listView.render();
  // },

  // _search: function () {
  //   var keyword = this.model.get('query');

  //   // fetch part is missing for now, mocking
  //   this._showResults(keyword);
  // },

  // _filterResults: function (keyword) {
  //   var items = [];
  //   var filtered = this._filteredCollection();

  //   if (keyword === '') {
  //     items = this._promoteSelected(this._measurementsCollection.models.slice(0, this.options.maxItems));
  //   } else {
  //     items = filtered.filter(function (model) {
  //       var name = model.getName();
  //       return name.toLowerCase().indexOf(keyword) !== -1;
  //     });
  //     items.length = Math.min(items.length, this.options.maxItems);
  //   }

  //   this.model.set({
  //     items: items.length
  //   });

  //   this.collection.reset(items);
  // },

  _promoteSelected: function (items) {
    var selected = this._measurementsCollection.getSelectedItem();
    if (selected) {
      return [selected].concat(_.filter(items, function (model) {
        return model.get('selected') !== true;
      })).slice(0, this.options.maxItems);
    } else {
      return items;
    }
  }
});
