var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PaginationModel = require('../pagination/pagination-model');
var PaginationSearchModel = require('./pagination-search-model');
var renderLoading = require('../loading/render-loading');
var template = require('./pagination-search.tpl');
var Utils = require('../../../helpers/utils');
var PaginationView = require('../pagination/view');

/**
 * View to render a searchable/pageable collection.
 * Also allows to filter/search list.
 *
 * - collection is a collection which has a PagedSearchModel.
 */

var REQUIRED_OPTS = [
  'listCollection',
  'createContentView'
];

var ENTER_KEY_CODE = 13;
var ESCAPE_KEY_CODE = 27;

module.exports = CoreView.extend({

  events: {
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._paginationModel = new PaginationModel({
      current_page: 1
    });

    this._paginationSearchModel = new PaginationSearchModel({}, {
      collection: this._listCollection
    });

    this._statusModel = new Backbone.Model({
      state: 'loading'
    });

    this._paginationSearchModel.fetch();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    this._$cleanSearchBtn().hide();
    return this;
  },

  _initBinds: function () {
    // TODO bind _listCollection state: fetching, fetched, error
  },

  _toggleCleanSearchBtn: function () {
    this._$cleanSearchBtn().toggle(!!this._paginationSearchModel.get('q'));
  },

  _initViews: function () {
    this.paginationView = new PaginationView({
      model: this._paginationModel
    });
    this.addView(this.paginationView);

    // TODO loading, list, error
  },

  _focusSearchInput: function () {
    this._$searchInput().focus().val();
  },

  _onSearchClick: function (e) {
    this.killEvent(e);
    this._$searchInput().focus();
  },

  _onCleanSearchClick: function (e) {
    this.killEvent(e);
    this._cleanSearch();
  },

  _onKeyDown: function (e) {
    this.killEvent(e);
    if (e.which === ENTER_KEY_CODE) {
      this._submitSearch();
    } else if (e.which === ESCAPE_KEY_CODE) {
      if (this._paginationSearchModel.get('q')) {
        this._cleanSearch();
      }
    }
  },

  _submitSearch: function (e) {
    this._makeNewSearch(Utils.stripHTML(this._$searchInput().val().trim()));
  },

  _cleanSearch: function () {
    this._$searchInput().val('');
    this._makeNewSearch();
  },

  _makeNewSearch: function (query) {
    this._paginationSearchModel.set({
      q: query,
      page: 1
    });

    this._paginationSearchModel.fetch();
  },

  _$searchInput: function () {
    return this.$('.js-search-input');
  },

  _$cleanSearchBtn: function () {
    return this.$('.js-clean-search');
  },

  _$tabPane: function () {
    return this.$('.js-tab-pane');
  }

});
