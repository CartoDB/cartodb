var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var PaginationModel = require('../pagination/model');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');
var PaginationView = require('../pagination/view');

/**
 * View to render a set of views
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
    _.each(['organizationUsers', 'createUsersView'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this.organizationUsers = this.options.organizationUsers;
    this.paginationModel = new PaginationModel({
      current_page: this.organizationUsers.getParameter('page'),
      total_count: this.organizationUsers.getTotalUsers(),
      per_page: this.organizationUsers.getParameter('per_page')
    });
    this.elder('initialize');
    this._initBinds();
    this.organizationUsers.fetch();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.getTemplate('common/views/org_users/org_users')({
        q: this.organizationUsers.getSearch()
      })
    );

    this._initViews();
    // Hide clean search button from the beginning
    this.$('.js-clean-search').hide();

    return this;
  },

  _initBinds: function() {
    this.organizationUsers.bind('loading', function() {
      this._activatePane('loading');
    }, this);

    this.organizationUsers.bind('error', function(e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._activatePane('error');
      }
    }, this);

    this.organizationUsers.bind('reset', function(collection) {
      var total = collection.getTotalUsers();
      this.paginationModel.set({
        total_count: collection.getTotalUsers(),
        current_page: collection.getParameter('page')
      });
      this._activatePane(total > 0 ? 'users' : 'no_results');
    }, this);

    this.organizationUsers.bind('reset error loading', function() {
      this.$('.js-clean-search').toggle(!!this.organizationUsers.getSearch())
    }, this);

    this.paginationModel.bind('change:current_page', function(mdl) {
      var newPage = mdl.get('current_page');
      this.organizationUsers
        .setParameters({
          page: newPage
        })
        .fetch();
    }, this);

    this.add_related_model(this.organizationUsers);
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
        this.options.createUsersView(),
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

    if (this.organizationUsers.getSearch()) {
      this._focusSearchInput();
    }

    var activePane = 'loading';
    if (this.organizationUsers.getTotalUsers() === 0) {
      activePane = 'no_results';
    } else if (this.organizationUsers.getTotalUsers() > 0) {
      activePane = 'users';
    }

    this._activatePane(activePane);
  },

  _activatePane: function(name) {
    this._panes && this._panes.active(name).render();
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
      if (this.organizationUsers.getSearch()) {
        this._cleanSearch();
      }
    }
  },

  _submitSearch: function(e) {
    var search = this.$('.js-search-input').val().trim();
    this.organizationUsers
      .setParameters({
        q: Utils.stripHTML(search),
        page: 1
      })
      .fetch();
  },

  _cleanSearch: function() {
    this.$('.js-search-input').val('');
    this.organizationUsers
      .setParameters({
        q: '',
        page: 1
      })
      .fetch();
  }
});
