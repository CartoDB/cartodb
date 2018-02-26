var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListView = require('builder/components/custom-list/custom-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./lazy-list.tpl');
var SearchView = require('./lazy-search-view');
var statusTemplate = require('./lazy-list-view-states.tpl');

var REQUIRED_OPTS = [
  'searchCollection',
  'lazySearch'
];

module.exports = CoreView.extend({
  className: 'CDB-Box-modal CustomList',
  module: 'components:lazy-load:lazy-list-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._type = opts.type || _t('components.backbone-forms.lazy-select.type');
    this.model = new Backbone.Model({
      query: '',
      visible: false
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template());
    this._createSearchView();
    this._renderListSection();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._searchCollection.stateModel, 'change:state', this._renderListSection);
    this.listenTo(this.model, 'change:query', this._search);

    this.listenTo(this.model, 'change:visible', function (mdl, isVisible) {
      isVisible ? this.render() : this.clearSubViews();
      this._toggleVisibility();
    });
  },

  _createListView: function () {
    if (this._listView) {
      this._listView.clean();
      this.removeView(this._listView);
    }

    this._listView = new CustomListView({
      className: '',
      typeLabel: this._type,
      showSearch: false,
      collection: this._searchCollection,
      searchPlaceholder: this.options.searchPlaceholder
    });

    this.addView(this._listView);
    this._listView.show();
    this.$('.js-list').html(this._listView.$el);
  },

  _createStatusView: function (status) {
    var el = statusTemplate({
      status: status,
      type: this._type
    });

    this.$('.js-list').html(el);
  },

  _renderListSection: function () {
    var status = this._searchCollection.stateModel.get('state');

    if (status === 'fetched') {
      this._createListView();
    } else {
      this._createStatusView(status);
    }
  },

  _createSearchView: function () {
    this._searchView = new SearchView({
      model: this.model
    });
    this.addView(this._searchView);
    this.$('.js-search').append(this._searchView.render().el);
  },

  _search: function () {
    var keyword = this.model.get('query');

    // This function is passed from the parent
    this._lazySearch(keyword);
  },

  _isSerching: function () {
    return !!this.model.get('query');
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.isVisible());
  }
});
