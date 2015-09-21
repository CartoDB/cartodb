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
    this.collection.each(function(grantable) {
      this._appendView(
        new PermissionView({
          model: grantable.entity,
          permission: this.model.get('permission'),
          isWriteAccessTogglerAvailable: this.model.isWriteAccessTogglerAvailable(),
          detailsView: this._createDetailsView(grantable)
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

  _createDetailsView: function(grantable) {
    var type = grantable.get('type');
    var opts = this._detailsViewOpts.bind(this, grantable.entity, this.model.get('vis').tableMetadata().dependentVisualizations());
    switch(type) {
      case 'user':
        return new UserDetailsView(
          opts([grantable.id])
        );
        break;
      case 'group':
        return new GroupDetailsView(
          opts(grantable.entity.users.models)
        );
        break;
      default:
        cdb.log.error('No details view for grantable model of type ' + type);
        return new cdb.core.View(opts());
    }
  },

  _detailsViewOpts: function(grantableEntity, dependentVisualizations, dependentUsers) {
    return {
      className: 'ChangePrivacy-shareListItemInfo',
      model: grantableEntity,
      permission: this.model.get('permission'),
      isUsingVis: _.any(dependentVisualizations, function(vis) {
        return _.any(dependentUsers, function(u) {
          return vis.permission.owner.id === u.id;
        });
      })
    };
  }

});
