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
    'click .js-save' : '_onClickSave',
    'click .js-back' : '_onClickBack'
  },

  initialize: function(args) {
    this._org = args.organization;
    this._permission = args.permission;
    this._canChangeWriteAccess = args.canChangeWriteAccess;
    this._tableMetadata = args.tableMetadata;

    this._template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view/template');
  },

  render: function() {
    this.clearSubViews();

    var usersCount = this._org.users.length;

    this.$el.html(
      this._template({
        usersCount: usersCount,
        colleagueOrColleaguesStr: pluralizeString('colleage', usersCount)
      })
    );

    this._renderOrganizationPermissionView();
    this._renderUserPermissionViews();

    return this;
  },

  _renderOrganizationPermissionView: function() {
    this._appendPermissionView(
      new PermissionView({
        model: this._org,
        permission: this._permission,
        canChangeWriteAccess: this._canChangeWriteAccess,
        title: 'Default settings for your Organization',
        desc: 'New users will have this permission'
      })
    );
  },

  _renderUserPermissionViews: function() {
    var usersUsingVis = this._usersUsingVis();

    this._org.users.each(function(user) {
      this._appendPermissionView(
        new PermissionView({
          model: user,
          permission: this._permission,
          canChangeWriteAccess: this._canChangeWriteAccess,
          title: user.get('username'),
          desc: user.get('name'),
          avatarUrl: user.get('avatar_url'),
          isUsingVis: _.any(usersUsingVis, function(u) { return u.id === user.get('id'); })
        })
      );
    }, this);
  },

  _usersUsingVis: function() {
    return _.chain(_.union(
        this._tableMetadata.get('dependent_visualizations'),
        this._tableMetadata.get('non_dependent_visualizations')
      ))
      .compact()
      .map(function(visData) {
        return visData.permission.owner;
      })
      .value();
  },

  _appendPermissionView: function(view) {
    this.$('.js-permissions').append(view.render().el);
    this.addView(view);
  },

  _onClickBack: function(ev) {
    this.killEvent(ev);
    this.trigger('click:back');
  },

  _onClickSave: function(ev) {
    this.killEvent(ev);
    this.trigger('click:save');
  }
});
