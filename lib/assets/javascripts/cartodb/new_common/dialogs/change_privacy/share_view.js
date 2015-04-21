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
    'click .js-save' : '_onClickSave'
  },

  initialize: function() {
    if (!this.options.viewModel) {
      throw new Error('viewModel is compulsory');
    }
    this._viewModel = this.options.viewModel;
    this.add_related_model(this._viewModel);

    this._template = cdb.templates.getTemplate('new_common/dialogs/change_privacy/share_view/template');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this._template({
      })
    );

    this._renderOrganizationPermissionView();
    this._renderUserPermissionViews();

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

  _renderUserPermissionViews: function() {
    var usersUsingVis = this._viewModel.usersUsingVis();

    this._organization().users.each(function(user) {
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
  }
});
