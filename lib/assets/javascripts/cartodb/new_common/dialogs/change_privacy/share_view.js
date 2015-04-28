var cdb = require('cartodb.js');
var _ = require('underscore');
var pluralizeString = require('../../../new_common/view_helpers/pluralize_string');
var PermissionView = require('./share_view/permission_view');

/**
 * Share view, to manage organization users' permissions to the parent subject.
 */
module.exports = cdb.core.View.extend({

  className: 'Dialog-expandedSubContent',

  events: {
    'click .js-save': '_onClickSave',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function() {
    if (!this.options.viewModel) {
      throw new Error('viewModel is compulsory');
    }
    this._viewModel = this.options.viewModel;
    this.add_related_model(this._viewModel);
    this._template = cdb.templates.getTemplate('new_common/dialogs/change_privacy/share_view/template');

    this._viewModel.bind('change:userSearch', this.render, this);
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this._template({
        q: this._viewModel.get('userSearch')
      })
    );

    this._renderOrganizationPermissionView();
    this._renderUserPermissionViews();

    // Focus and move cursor to the end of search input
    setTimeout(function() {
      var $searchInput = this.$('.js-search-input');
      $searchInput.focus().val($searchInput.val());
    }, 0);

    return this;
  },

  _organization: function() {
    return this._viewModel.get('user').organization;
  },

  _renderOrganizationPermissionView: function() {
    this._appendPermissionView(
      new PermissionView({
        model: this._organization(),
        permission: this._viewModel.get('permission'),
        canChangeWriteAccess: this._viewModel.canChangeWriteAccess(),
        title: 'Default settings for your Organization',
        desc: 'New users will have this permission'
      })
    );
  },

  _onKeyDown: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    }
  },

  _submitSearch: function(e) {
    var search = this.$('.js-search-input').val();
    this._viewModel.set('userSearch', search);
  },

  _renderUserPermissionViews: function() {
    var organizationUsers = this._viewModel.organizationUsers();
    var usersUsingVis = this._viewModel.usersUsingVis();

    _.each(organizationUsers, function(user) {
      this._appendPermissionView(
        new PermissionView({
          model: user,
          permission: this._viewModel.get('permission'),
          canChangeWriteAccess: this._viewModel.canChangeWriteAccess(),
          title: user.get('username'),
          desc: user.get('name'),
          avatarUrl: user.get('avatar_url'),
          isUsingVis: _.any(usersUsingVis, function(u) { return u.id === user.get('id'); })
        })
      );
    }, this);
  },

  _appendPermissionView: function(view) {
    this.$('.js-permissions').append(view.render().el);
    this.addView(view);
  },

  _onClickSave: function(ev) {
    this.killEvent(ev);
    this._viewModel.save();
  },

  _onCleanSearchClick: function(ev) {
    this._viewModel.set('userSearch', '');
  }
});
