var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var PermissionView = require('./permission_view');
var UserDetailsView = require('./user_details_view');
var GroupDetailsView = require('./group_details_view');
var ViewFactory = require('../../../view_factory');

/**
 * Content view of the share dialog, lists of users to share item with.
 * - model: {Object} the share view model
 * - collection: {cdb.admin.Grantables}
 * - hasSearch: {Boolean}
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['model', 'collection', 'pagedSearchModel'], function(name) {
      if (_.isUndefined(this.options[name])) throw new Error(name + ' is required');
    }, this);

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();

    if (!this.options.pagedSearchModel.get('q')) {
      this._renderOrganizationPermissionView()
    }
    this._renderGrantablesViews();
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);

    this.options.pagedSearchModel.on('change:q', this.render, this);
    this.add_related_model(this.options.pagedSearchModel);
  },

  _renderGrantablesViews: function() {
    var dependentVisualizations = this.model.get('vis').tableMetadata().dependentVisualizations();
    this.collection.each(function(grantable) {
      this._appendView(
        new PermissionView({
          model: grantable.entity,
          permission: this.model.get('permission'),
          isWriteAccessTogglerAvailable: this.model.isWriteAccessTogglerAvailable(),
          detailsView: this._createDetailsView(
            this._detailsViewOpts.bind(this, dependentVisualizations, grantable.entity),
            grantable
          )
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
        detailsView: ViewFactory.createByTemplate('common/dialogs/change_privacy/share/details', {
          avatarUrl: false,
          willRevokeAccess: false,
          title: 'Default settings for your Organization',
          desc: 'New users will have this permission',
          roleLabel: false
        }, {
          className: 'ChangePrivacy-shareListItemInfo'
        })
      })
    );
  },

  _appendView: function(view) {
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _createDetailsView: function(detailsViewOpts, grantable) {
    var type = grantable.get('type');
    switch(type) {
      case 'user':
        return new UserDetailsView(
          detailsViewOpts([grantable.id])
        );
        break;
      case 'group':
        return new GroupDetailsView(
          detailsViewOpts(
            grantable.entity.users.chain()
              .reject(this._isCurrentUser)
              .pluck('id')
              .value()
          )
        );
        break;
      default:
        cdb.log.error('No details view for grantable model of type ' + type);
        return new cdb.core.View(detailsViewOpts());
    }
  },

  _detailsViewOpts: function(dependentVisualizations, grantableEntity, userIds) {
    return {
      className: 'ChangePrivacy-shareListItemInfo',
      model: grantableEntity,
      permission: this.model.get('permission'),
      isUsingVis: _.any(dependentVisualizations, function(vis) {
        return _.any(userIds, function(userId) {
          return userId === vis.permission.owner.id;
        })
      })
    };
  },

  _isCurrentUser: function(user) {
    return user.id === cdb.config.get('user').id;
  },

});
