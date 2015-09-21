var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var PermissionView = require('./permission_view');
var UserDetailsView = require('./user_details_view');
var GroupDetailsView = require('./group_details_view');
var ViewFactory = require('../../../view_factory');

/**
 * Content view of the share dialog, lists of users to share item with.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();

    if (!this.collection.get('q')) {
      this._renderOrganizationPermissionView()
    }
    this._renderGrantablesViews();
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  _renderGrantablesViews: function() {
    var usersUsingVis = this.model.usersUsingVis();
    this.collection.each(function(grantable) {
      this._appendView(
        new PermissionView({
          model: grantable.entity,
          permission: this.model.get('permission'),
          isWriteAccessTogglerAvailable: this.model.isWriteAccessTogglerAvailable(),
          detailsView: this._createDetailsView(grantable.get('type'), grantable.entity, usersUsingVis)
        })
      )
    }, this);
  },

  _renderOrganizationPermissionView: function() {
    this._appendView(
      new PermissionView({
        model: this.model.get('organization'),
        permission: this.model.get('permission'),
        isWriteAccessTogglerAvailable: this.model.isWriteAccessTogglerAvailable(),
        detailsView: ViewFactory.createByTemplate('common/dialogs/change_privacy/share/organization_details', {}, {
          className: 'ChangePrivacy-shareListItemInfo'
        })
      })
    );
  },

  _appendView: function(view) {
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _createDetailsView: function(type, grantableEntity, usersUsingVis) {
    var className = 'ChangePrivacy-shareListItemInfo';
    var defaultOpts = {
      className: className,
      model: grantableEntity,
      permission: this.model.get('permission'),
    };
    switch(type) {
      case 'user':
        return new UserDetailsView(_.defaults({
          isUsingVis: _.any(usersUsingVis, function(u) { return u.id === grantableEntity.get('id'); })
        }, defaultOpts))
        break;
      case 'group':
        return new GroupDetailsView(_.defaults({
        }, defaultOpts))
        break;
      default:
        return new cdb.core.View({
          className: className
        });
    }
  }

});
