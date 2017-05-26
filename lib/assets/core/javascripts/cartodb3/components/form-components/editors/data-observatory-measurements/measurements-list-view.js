var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListItemView = require('./measurement-list-item-view');
var itemListTemplate = require('./measurement-list-item.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var template = require('./measurements-list.tpl');
var SearchMeasurementView = require('./measurements-search-view');
var CountMeasurementView = require('./measurements-count-view');

var REQUIRED_OPTS = [
  'measurementsCollection'
];

module.exports = CoreView.extend({
  options: {
    maxItems: 50
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      query: '',
      items: this.options.maxItems
    });

    this.collection = new CustomListCollection([]);

    this._filterResults('');
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template());
    this._createSearchView();
    this._createCountView();
    this._createListView();
    return this;
  },

  _createListView: function () {
    this._listView = new CustomListView({
      className: 'DO-Measurements',
      typeLabel: _t('components.backbone-forms.data-observatory.dropdown.measurement.type'),
      showSearch: false,
      itemView: CustomListItemView,
      collection: this.collection,
      itemTemplate: itemListTemplate
    });

    this.addView(this._listView);
    this.$('.js-list').append(this._listView.render().$el);
  },

  _createSearchView: function () {
    var view = new SearchMeasurementView({
      model: this.model
    });
    this.addView(view);
    this.$('.js-search').append(view.render().el);
  },

  _createCountView: function () {
    var view = new CountMeasurementView({
      model: this.model
    });
    this.addView(view);
    this.$('.js-count').append(view.render().el);
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'change:selected', this._onSelectItem);
    this.listenTo(this.model, 'change:query', this._search);
  },

  _showResults: function (keyword) {
    this._filterResults(keyword);
    this._listView.render();
  },

  _search: function () {
    var keyword = this.model.get('query');
    // fetch part is missing for now
    this._showResults(keyword);
  },

  _filterResults: function (keyword) {
    var items = [];

    if (keyword === '') {
      items = this._measurementsCollection.models.slice(0, this.options.maxItems);
    } else {
      items = this._measurementsCollection.filter(function (model) {
        var name = model.getName();
        return name.toLowerCase().indexOf(keyword) !== -1;
      });
      items.length = Math.min(items.length, this.options.maxItems);
    }

    this.model.set({
      items: items.length
    });
    this.collection.reset(items);
  },

  _onSelectItem: function (item) {
    this._measurementsCollection.setSelected(item.getValue());
  }
});
