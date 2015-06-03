var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var PermissionView = require('./permission_view');
var PaginationModel = require('../../../views/pagination/model');
var PaginationView = require('../../../views/pagination/view');
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
        name: this.model.name(),
        q: this.model.get('search')
      })
    );

    this._initViews();

    return this;
  },

  _initBinds: function() {
    this.organization.users.bind('loading', function() {
      console.log("loading");
    }, this);
    this.paginationModel.bind('change', function(mdl) {
      var newPage = mdl.get('current_page');
      this.organizationUsers
        .setParameter('page', newPage)
        .fetch();
    }, this);
    this.organizationUsers.bind('reset', function(coll) {
      this.paginationModel.set('total_count', coll.getTotalUsers());
      this.render();
    }, this);
    this.organizationUsers.bind('reset', this.render, this);
    this.model.bind('all', this.render, this);
    this.add_related_model(this.organizationUsers);
    this.add_related_model(this.paginationModel);
  },

  _initViews: function() {
    // Panes
    // this._panes = new cdb.ui.common.TabPane({
    //   el: this.$('.js-permissionContent')
    // });
    // this.addView(this._panes);
    
    // this._panes.addTab('users',
    //   new PermissionsView({
    //     model: this.model,
    //     organization: this.organization,
    //     currentUser: this.user,
    //     ChangePrivacyView: this.options.ChangePrivacyView
    //   })
    // );

    // this._panes.addTab('loading',
    //   ViewFactory.createByTemplate('common/templates/loading', {
    //     title: 'Getting users…',
    //     quote: randomQuote()
    //   }).render()
    // );
    // this._panes.addTab('error',
    //   ViewFactory.createByTemplate('common/templates/fail', {
    //     msg: ''
    //   }).render()
    // );

    if (this.model.get('search') === '') {
      this._renderOrganizationPermissionView();
    } else {
      this._focusSearchInput();
    }
    
    this._renderUserPermissionViews();

    var paginationView = new PaginationView({
      el: '.js-content-footer',
      model: this.paginationModel
    });
    paginationView.render();
    this.addView(paginationView);
  },

  _renderUserPermissionViews: function() {
    var usersUsingVis = this.model.usersUsingVis();
    this.organizationUsers.each(function(user) {
      if (user.id !== this.currentUser.id) {
        this._appendPermissionView(
          new PermissionView({
            model: user,
            permission: this.model.get('permission'),
            canChangeWriteAccess: this.model.canChangeWriteAccess(),
            title: user.get('username'),
            desc: user.get('name'),
            avatarUrl: user.get('avatar_url'),
            isUsingVis: _.any(usersUsingVis, function(u) { return u.id === user.get('id'); })
          })
        );  
      }
    }, this);
  },

  _appendPermissionView: function(view) {
    this.$('.js-content-footer').before(view.render().el);
    this.addView(view);
  },

  _renderOrganizationPermissionView: function() {
    this._appendPermissionView(
      new PermissionView({
        model: this.model.get('organization'),
        permission: this.model.get('permission'),
        canChangeWriteAccess: this.model.canChangeWriteAccess(),
        title: 'Default settings for your Organization',
        desc: 'New users will have this permission'
      })
    );
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
    this._cleanSearch()
  },

  _onKeyDown: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    var escapePressed = (ev.keyCode == $.ui.keyCode.ESCAPE);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } else if (escapePressed) {
      this.killEvent(ev);
      this._cleanSearch();
    }
  },

  _submitSearch: function(e) {
    var search = this.$('.js-search-input').val().trim();
    this.model.set('search', search); // WHAT?
    this.organizationUsers
      .setParameter('q', search)
      .fetch();
  },

  _cleanSearch: function() {
    this.model.set('search', ''); // WHAT?
    this.organizationUsers
      .setParameter('q', '')
      .fetch();
  }
});
