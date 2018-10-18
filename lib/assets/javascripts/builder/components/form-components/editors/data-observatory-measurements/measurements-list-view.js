var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CustomListView = require('builder/components/custom-list/custom-view');
var CustomListItemView = require('./measurement-list-item-view');
var itemListTemplate = require('./measurement-list-item.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./measurements-list.tpl');
var SearchMeasurementView = require('./measurements-search-view');
var CountMeasurementView = require('./measurements-count-view');
var statusTemplate = require('./list-view-states.tpl');

var REQUIRED_OPTS = [
  'filtersCollection',
  'measurementsCollection',
  'searchMeasurements',
  'measurementModel'
];

module.exports = CoreView.extend({
  options: {
    maxItems: 100
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      query: '',
      items: this.options.maxItems,
      filtered: false
    });

    this._initBinds();
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
    this.listenTo(this.model, 'change:query', this._search);
  },

  _createListView: function () {
    if (this._listView) {
      this._listView.clean();
      this.removeView(this._listView);
    }

    if (!this._isSerching()) {
      this._promoteSelected();
    }

    this.model.set({
      items: this._measurementsCollection.size(),
      filtering: this._isFiltering()
    });

    this._listView = new CustomListView({
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
      status: status,
      type: _t('components.backbone-forms.data-observatory.dropdown.measurement.type')
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
      model: this.model,
      filtersCollection: this._filtersCollection
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

  _search: function () {
    var keyword = this.model.get('query');

    // This function is passed from the parent
    this._searchMeasurements(keyword);
  },

  _isSerching: function () {
    return !!this.model.get('query');
  },

  _isFiltering: function () {
    var selectedFilters = this._filtersCollection.getSelected();
    return selectedFilters.length > 0;
  },

  _promoteSelected: function () {
    var selected = this._measurementModel;
    if (!selected.getValue()) {
      return;
    }

    var hit = this._measurementsCollection.findWhere({val: selected.getValue()});

    if (hit) {
      this._measurementsCollection.remove(hit);
    }

    var promoted = _.clone(selected.attributes);
    promoted.selected = true;

    this._measurementsCollection.add(promoted, {at: 0});
  }
});
