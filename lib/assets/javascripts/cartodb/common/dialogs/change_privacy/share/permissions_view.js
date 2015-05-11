var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var PermissionView = require('./permission_view');

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
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('common/dialogs/change_privacy/share/permissions');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this._template({
        name: this.model.name(),
        q: this.model.get('search')
      })
    );

    if (this.model.get('search') === '') {
      this._renderOrganizationPermissionView();
    } else {
      this._focusSearchInput();
    }
    this._renderUserPermissionViews();

    return this;
  },

  _initBinds: function() {
    this.model.bind('all', this.render, this);
  },

  _renderUserPermissionViews: function() {
    var usersUsingVis = this.model.usersUsingVis();
    _.each(this.model.organizationUsers(), function(user) {
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
    }, this);
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

  _appendPermissionView: function(view) {
    this.$('.js-permissions').append(view.render().el);
    this.addView(view);
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
    this.model.set('search', search);
  },

  _cleanSearch: function() {
    this.model.set('search', '');
  }
});
