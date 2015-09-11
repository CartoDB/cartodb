var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var PaginationModel = require('../pagination/model');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');
var PaginationView = require('../pagination/view');

/**
 * View to render a a searchable/pageable collection.
 * Also allows to filter/search users.
 */
module.exports = cdb.core.View.extend({

  className: 'Dialog-expandedSubContent',

  events: {
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function() {
    _.each(['collection', 'createListView'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this.collection = this.options.collection;

    var params = this.collection.params;
    this.paginationModel = new PaginationModel({
      current_page: params.get('page'),
      total_count: this.collection.total_count || 0,
      per_page: params.get('per_page')
    });

    this.elder('initialize');
    this._initBinds();
    this.collection.fetch();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.getTemplate('common/views/paged_search/paged_search')({
        q: this.collection.params.get('q')
      })
    );

    this._initViews();
    // Hide clean search button from the beginning
    this.$('.js-clean-search').hide();

    return this;
  },

  _initBinds: function() {
    this.collection.bind('loading', function() {
      this._activatePane('loading');
    }, this);

    this.collection.bind('error', function(e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._activatePane('error');
      }
    }, this);

    this.collection.bind('reset', function(collection) {
      this.paginationModel.set({
        total_count: collection.total_count,
        current_page: collection.params.get('page')
      });
      this._activatePane(collection.total_count > 0 ? 'users' : 'no_results');
    }, this);

    this.collection.bind('reset error loading', function() {
      this.$('.js-clean-search').toggle(!!this.collection.params.get('q'))
    }, this);

    this.paginationModel.bind('change:current_page', function(mdl, newPage) {
      this.collection.params.set('page', newPage);
      this.collection.fetch();
    }, this);

    this.add_related_model(this.collection);
    this.add_related_model(this.paginationModel);
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-tab-pane')
    });
    this.addView(this._panes);

    this._panes.addTab('users',
      ViewFactory.createByList([
        this.options.createListView(),
        new PaginationView({
          className: 'Pagination Pagination--shareList',
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
        icon: 'iconFont-DefaultUser',
        title: 'Oh! No results',
        msg: 'Unfortunately we haven\'t found any user with these parameters'
      })
    );

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting users…',
        quote: randomQuote()
      })
    );

    if (this.collection.params.get('q')) {
      this._focusSearchInput();
    }

    this._activatePane(this._chooseActivePaneName(this.collection.total_count));
  },

  _activatePane: function(name) {
    this._panes && this._panes.active(name).render()
  },

  _chooseActivePaneName: function(totalCount) {
    if (totalCount === 0) {
      return 'no_results';
    } else if (totalCount > 0) {
      return 'users';
    } else {
      return 'loading';
    }
  },

  _focusSearchInput: function() {
    var $searchInput = this.$('.js-search-input');
    $searchInput.focus().val($searchInput.val());
  },

  _onSearchClick: function(e) {
    if (e) this.killEvent(e);
    this.$('.js-search-input').focus();
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
      if (this.collection.params.get('q')) {
        this._cleanSearch();
      }
    }
  },

  _submitSearch: function(e) {
    var search = this.$('.js-search-input').val().trim();
    this.collection
      .setParameters({
        q: Utils.stripHTML(search),
        page: 1
      })
      .fetch();
  },

  _cleanSearch: function() {
    this.$('.js-search-input').val('');
    this.collection
      .setParameters({
        q: '',
        page: 1
      })
      .fetch();
  }
});
