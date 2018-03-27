const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const PaginationModel = require('builder/components/pagination/pagination-model');
const template = require('./paged-search.tpl');
const pagedSearchDialogWrapperTemplate = require('./paged-search-dialog-wrapper.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const loadingView = require('builder/components/loading/render-loading');
const noResultsView = require('builder/components/no-results/render-no-results.js');
const TabPane = require('dashboard/components/tabpane/tabpane');
const ViewFactory = require('builder/components/view-factory');
const PaginationView = require('builder/components/pagination/pagination-view');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'collection',
  'pagedSearchModel'
];

/**
 * View to render a searchable/pageable collection.
 * Also allows to filter/search list.
 * Set {isUsedInDialog: true} in view opts if intended to be used in a dialog, to have proper classes to position views
 * properly.
 *
 * - collection is a collection which has a PagedSearchModel.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.options.noResults = this.options.noResults || {};

    const params = this._pagedSearchModel;
    this.paginationModel = new PaginationModel({
      current_page: params.get('page'),
      total_count: this._collection.totalCount() || 0,
      per_page: params.get('per_page')
    });

    this._initBinds();
    this._pagedSearchModel.fetch(this._collection);
  },

  _initBinds: function () {
    this.listenTo(this._collection, 'fetching', function () {
      this._toggleCleanSearchBtn();
      this._activatePane('loading');
    });

    this.listenTo(this._collection, 'error', function (e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== 'abort')) {
        this._activatePane('error');
      }
      this._toggleCleanSearchBtn();
    });

    this.listenTo(this._collection, 'sync', function (collection) {
      this.paginationModel.set({
        total_count: this._collection.totalCount(),
        current_page: this._pagedSearchModel.get('page')
      });
      this._activatePane(this._collection.totalCount() > 0 ? 'list' : 'no_results');
      this._toggleCleanSearchBtn();
    });

    this.listenTo(this.paginationModel, 'change:current_page', function (model, newPage) {
      this._pagedSearchModel.set('page', newPage);
      this._pagedSearchModel.fetch(this._collection);
    });
  },

  render: function () {
    this.clearSubViews();

    this._renderContent(
      template({
        thinFilters: this.options.thinFilters || false,
        q: this._pagedSearchModel.get('q')
      })
    );

    this._initViews();
    this._$cleanSearchBtn().hide();
    this._renderExtraFilters();

    return this;
  },

  _renderExtraFilters: function () {
    if (this.options.filtersExtrasView) {
      this.$('.js-filters').append(this.options.filtersExtrasView.render().el);
    }
  },

  _renderContent: function (html) {
    if (this.options.isUsedInDialog) {
      html = pagedSearchDialogWrapperTemplate({
        htmlToWrap: html
      });
    }
    this.$el.html(html);

    // Needs to be called after $el html changed:
    if (this.options.isUsedInDialog) {
      this.$el.addClass('Dialog-expandedSubContent');
      this._$tabPane().addClass('Dialog-bodyInnerExpandedWithSubFooter');
    }
  },

  _toggleCleanSearchBtn: function () {
    this._$cleanSearchBtn().toggle(!!this._pagedSearchModel.get('q'));
  },

  _initViews: function () {
    this._panes = new TabPane({
      el: this._$tabPane()
    });

    this.addView(this._panes);

    this._panes.addTab('list',
      ViewFactory.createListView([
        () => this._createListView(),

        () => new PaginationView({
          className: 'CDB-Text CDB-Size-medium Pagination Pagination--shareList',
          model: this.paginationModel
        })
      ])
    );

    this._panes.addTab('error',
      ViewFactory.createByHTML(errorTemplate({
        msg: ''
      })).render()
    );

    this._panes.addTab('no_results',
      ViewFactory.createByHTML(noResultsView({
        icon: this.options.noResults.icon || 'CDB-IconFont-defaultUser',
        title: this.options.noResults.title || 'Oh! No results',
        msg: this.options.noResults.msg || 'Unfortunately we could not find anything with these parameters'
      })).render()
    );

    this._panes.addTab('loading',
      ViewFactory.createByHTML(loadingView({
        title: 'Searching'
      })).render()
    );

    if (this._pagedSearchModel.get('q')) {
      this._focusSearchInput();
    }

    this._activatePane(this._chooseActivePaneName(this._collection.totalCount()));
  },

  _createListView: function () {
    var view = this.options.createListView();
    if (view instanceof CoreView) {
      return view;
    } else {
      console.error('createListView function must return a view');
      // fallback for view to not fail miserably
      return new CoreView();
    }
  },

  _activatePane: function (name) {
    // Only change active pane if the panes is actually initialized
    if (this._panes && this._panes.size() > 0) {
      // explicit render required, since tabpane doesn't do it
      this._panes.active(name).render();
    }
  },

  _chooseActivePaneName: function (totalCount) {
    if (totalCount === 0) {
      return 'no_results';
    } else if (totalCount > 0) {
      return 'list';
    } else {
      return 'loading';
    }
  },

  _focusSearchInput: function () {
    // also selects the current search str on the focus
    this._$searchInput().focus().val(this._$searchInput().val());
  },

  _onSearchClick: function (ev) {
    this.killEvent(ev);
    this._$searchInput().focus();
  },

  _onCleanSearchClick: function (ev) {
    this.killEvent(ev);
    this._cleanSearch();
  },

  _onKeyDown: function (ev) {
    var enterPressed = (ev.key === 'Enter');
    var escapePressed = (ev.key === 'Escape');
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } else if (escapePressed) {
      this.killEvent(ev);
      if (this._pagedSearchModel.get('q')) {
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
    this._pagedSearchModel.set({
      q: query,
      page: 1
    });
    this._pagedSearchModel.fetch(this._collection);
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
