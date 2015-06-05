var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var PermissionUsersListView = require('./permission_users_view');
var PaginationModel = require('../../../views/pagination/model');
var randomQuote = require('../../../view_helpers/random_quote');
var ViewFactory = require('../../../view_factory');

/**
 * Content view of the share dialog, lists of users to share item with.
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
    if (!this.model) throw new Error('model is required');
    this.currentUser = this.options.currentUser;
    this.organization = this.options.organization;
    this.organizationUsers = this.organization.users;
    this.paginationModel = new PaginationModel({
      current_page: this.organizationUsers.getParameter('page'),
      total_count: this.organizationUsers.getTotalUsers(),
      per_page: this.organizationUsers.getParameter('per_page')
    });
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('common/dialogs/change_privacy/share/permissions');
    this._initBinds();
    this.organizationUsers.fetch();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this._template({
        q: this.organizationUsers.getSearch()
      })
    );

    this._initViews();
    // Hide clean search button from the beginning
    this._hideCleanSearchButton();

    return this;
  },

  _initBinds: function() {
    this.organizationUsers.bind('loading', function() {
      this._panes && this._panes.active('loading');
    }, this);

    this.organizationUsers.bind('error', function(e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._panes.active('error');
      }
    }, this);

    this.organizationUsers.bind('reset', function(coll) {
      var total = coll.getTotalUsers();
      this.paginationModel.set({
        total_count: coll.getTotalUsers(),
        current_page: coll.getParameter('page')
      });
      this._panes && this._panes.active(total > 0 ? 'users' : 'no_results');
    }, this);

    this.organizationUsers.bind('reset error loading', function(coll) {
      this[ this.organizationUsers.getSearch() ? '_showCleanSearchButton' : '_hideCleanSearchButton' ]();
    }, this);

    this.paginationModel.bind('change:current_page', function(mdl) {
      var newPage = mdl.get('current_page');
      this.organizationUsers
        .setParameters({
          page: newPage
        })
        .fetch();
    }, this);
    
    this.model.bind('all', this.render, this);
    
    this.add_related_model(this.organizationUsers);
    this.add_related_model(this.paginationModel);
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-permissionContent')
    });
    this.addView(this._panes);
    
    this._panes.addTab('users',
      new PermissionUsersListView({
        model: this.model,
        collection: this.organizationUsers,
        paginationModel: this.paginationModel
      }).render()
    );

    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );

    this._panes.addTab('no_results',
      ViewFactory.createByTemplate('common/templates/no_results', {
        icon: 'iconFont-DefaultUser',
        title: 'Oh! No results',
        msg: 'Unfortunately we haven\'t found any user with these parameters'
      }).render()
    );

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting users…',
        quote: randomQuote()
      }).render()
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
    
    this._panes.active(activePane);
  },

  _showCleanSearchButton: function() {
    this.$('.js-clean-search').show();
  },

  _hideCleanSearchButton: function() {
    this.$('.js-clean-search').hide();
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