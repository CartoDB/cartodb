var cdb = require('cartodb.js');
var _ = require('underscore');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var UserPermissionView = require('./share_view/user_permission_view');
var OrgPermissionView = require('./share_view/organization_permission_view');

/**
 * Share view, to manage organization users' permissions to the parent subject.
 */
module.exports = cdb.core.View.extend({
  
  className: 'Dialog-body Dialog-body--expanded',

  events: {
    'click .js-save' : '_onClickSave',
    'click .js-back' : '_onClickBack'
  },

  initialize: function(args) {
    this._org = args.organization;
    this._permission = args.permission;

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
      new OrgPermissionView({
        model: this._org
      })
    );
  },

  _renderUserPermissionViews: function() {
    this._org.users.each(function(user) {
      this._appendPermissionView(
        new UserPermissionView({
          model: user
        })
      );
    }, this);
  },
  
  _appendPermissionView: function(view) {
    this.$('.js-permissions').append(view.render().el);
    this.addView(view);
  },

  _onClickBack: function(ev) {
    this.killEvent(ev);
    this.trigger('click:back');
  },

  _onClickSave: function() {
    this.killEvent(ev);
    this.trigger('click:save');
  }
});
