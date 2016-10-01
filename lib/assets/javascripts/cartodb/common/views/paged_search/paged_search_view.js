var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var Utils = require('cdb.Utils');
var PaginationModel = require('../pagination/model');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');
var PaginationView = require('../pagination/view');

/**
 * View to render a searchable/pageable collection.
 * Also allows to filter/search list.
 * Set {isUsedInDialog: true} in view opts if intended to be used in a dialog, to have proper classes to position views
 * properly.
 *
 * - collection is a collection which has a PagedSearchModel.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function() {
    _.each(['collection', 'pagedSearchModel', 'createListView'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this.collection = this.options.collection;
    this.options.noResults = this.options.noResults || {}

    var params = this.options.pagedSearchModel;
    this.paginationModel = new PaginationModel({
      current_page: params.get('page'),
      total_count: this.collection.totalCount() || 0,
      per_page: params.get('per_page')
    });

    this.elder('initialize');
    this._initBinds();
    this.options.pagedSearchModel.fetch(this.collection);
  },

  render: function() {
    this.clearSubViews();

    this._renderContent(
      this.getTemplate('common/views/paged_search/paged_search')({
        thinFilters: this.options.thinFilters,
        q: this.options.pagedSearchModel.get('q')
      })
    );

    this._initViews();
    this._$cleanSearchBtn().hide();
    this._renderExtraFilters();

    return this;
  },

  _renderExtraFilters: function() {
    if (this.options.filtersExtrasView && this.options.filtersExtrasView) {
      this.$('.js-filters').append(this.options.filtersExtrasView.render().el);
    }
  },

  _renderContent: function(html) {
    if (this.options.isUsedInDialog) {
      html = this.getTemplate('common/views/paged_search/paged_search_dialog_wrapper')({
        htmlToWrap: html
      })
    }
    this.$el.html(html);

    // Needs to be called after $el html changed:
    if (this.options.isUsedInDialog) {
      this.$el.addClass('Dialog-expandedSubContent');
      this._$tabPane().addClass('Dialog-bodyInnerExpandedWithSubFooter');
    }
  },

  _initBinds: function() {
    this.collection.bind('fetching', function() {
      this._toggleCleanSearchBtn();
      this._activatePane('loading');
    }, this);

    this.collection.bind('error', function(e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._activatePane('error');
      }
      this._toggleCleanSearchBtn();
    }, this);

    this.collection.bind('reset', function(collection) {
      this.paginationModel.set({
        total_count: this.collection.totalCount(),
        current_page: this.options.pagedSearchModel.get('page')
      });
      this._activatePane(this.collection.totalCount() > 0 ? 'list' : 'no_results');
      this._toggleCleanSearchBtn();
    }, this);

    this.paginationModel.bind('change:current_page', function(mdl, newPage) {
      this.options.pagedSearchModel.set('page', newPage);
      this.options.pagedSearchModel.fetch(this.collection);
    }, this);

    this.add_related_model(this.options.pagedSearchModel);
    this.add_related_model(this.collection);
    this.add_related_model(this.paginationModel);
  },

  _toggleCleanSearchBtn: function() {
    this._$cleanSearchBtn().toggle(!!this.options.pagedSearchModel.get('q'))
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this._$tabPane()
    });
    this.addView(this._panes);

    this._panes.addTab('list',
      ViewFactory.createByList([
        this._createListView(),
        new PaginationView({
          className: 'CDB-Text CDB-Size-medium Pagination Pagination--shareList',
          model: this.paginationModel
        })
      ])
    );

    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      })
    );

    this._panes.addTab('no_results',
      ViewFactory.createByTemplate('common/templates/no_results', {
        icon: this.options.noResults.icon || 'CDB-IconFont-defaultUser',
        title: this.options.noResults.title || 'Oh! No results',
        msg: this.options.noResults.msg || 'Unfortunately we could not find anything with these parameters'
      })
    );

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Searching',
        quote: randomQuote()
      })
    );

    if (this.options.pagedSearchModel.get('q')) {
      this._focusSearchInput();
    }

    this._activatePane(this._chooseActivePaneName(this.collection.totalCount()));
  },

  _createListView: function() {
    var view = this.options.createListView();
    if (view instanceof cdb.core.View) {
      return view;
    } else {
      cdb.log.error('createListView function must return a view');
      // fallback for view to not fail miserably
      return new cdb.core.View();
    }
  },

  _activatePane: function(name) {
    // Only change active pane if the panes is actually initialized
    if (this._panes && this._panes.size() > 0) {
      // explicit render required, since tabpane doesn't do it
      this._panes.active(name).render();
    }
  },

  _chooseActivePaneName: function(totalCount) {
    if (totalCount === 0) {
      return 'no_results';
    } else if (totalCount > 0) {
      return 'list';
    } else {
      return 'loading';
    }
  },

  _focusSearchInput: function() {
    // also selects the current search str on the focus
    this._$searchInput().focus().val(this._$searchInput().val());
  },

  _onSearchClick: function(ev) {
    this.killEvent(ev);
    this._$searchInput().focus();
  },

  _onCleanSearchClick: function(ev) {
    this.killEvent(ev);
    this._cleanSearch();
  },

  _onKeyDown: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    var escapePressed = (ev.keyCode == $.ui.keyCode.ESCAPE);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } else if (escapePressed) {
      this.killEvent(ev);
      if (this.options.pagedSearchModel.get('q')) {
        this._cleanSearch();
      }
    }
  },

  _submitSearch: function(e) {
    this._makeNewSearch(Utils.stripHTML(this._$searchInput().val().trim()));
  },

  _cleanSearch: function() {
    this._$searchInput().val('');
    this._makeNewSearch();
  },

  _makeNewSearch: function(query) {
    this.options.pagedSearchModel.set({
      q: query,
      page: 1
    });
    this.options.pagedSearchModel.fetch(this.collection);
  },

  _$searchInput: function() {
    return this.$('.js-search-input');
  },

  _$cleanSearchBtn: function() {
    return this.$('.js-clean-search');
  },

  _$tabPane: function() {
    return this.$('.js-tab-pane');
  }

});
