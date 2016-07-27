var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PermissionView = require('./share-permission-view');

var REQUIRED_OPTS = [
  'collection',
  'currentUserId',
  'organization',
  'hasOrganization',
  'sharePermissionModel',
  'isVisualization'
];

module.exports = CoreView.extend({
  className: 'Share-list',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._sharePermissionModel.acl.on('add remove reset change', this.render, this);
    this.add_related_model(this._sharePermissionModel);
  },

  _initViews: function () {
    if (this._hasOrganization) {
      this._renderOrganization();
    }

    // sharing first
    var sharing = this._collection.filter(function (model) {
      var permission = this._sharePermissionModel;
      var hasWriteAccess = permission.hasWriteAccess(model);
      var hasReadAccess = permission.hasReadAccess(model);
      return hasWriteAccess || hasReadAccess;
    }, this);

    var noSharing = this._collection.filter(function (model) {
      var permission = this._sharePermissionModel;
      var hasWriteAccess = permission.hasWriteAccess(model);
      var hasReadAccess = permission.hasReadAccess(model);
      return !hasWriteAccess && !hasReadAccess;
    }, this);

    _.each(sharing, this._renderItem, this);
    _.each(noSharing, this._renderItem, this);
  },

  _renderOrganization: function () {
    var self = this;
    var organization = this._organization;
    var permission = this._sharePermissionModel;
    var hasWriteAccessAvailable = !self._isVisualization;
    var canChangeWriteAccess = permission.canChangeWriteAccess(organization);
    var hasWriteAccess = permission.hasWriteAccess(organization);
    var canChangeReadAccess = permission.canChangeReadAccess(organization);
    var hasReadAccess = permission.hasReadAccess(organization);

    var view = new PermissionView({
      model: organization,
      permission: permission,
      avatar: organization.get('avatar_url'),
      description: _t('components.modals.publish.share.organization.desc'),
      name: _t('components.modals.publish.share.organization.title'),
      canChangeReadAccess: canChangeReadAccess,
      hasReadAccess: hasReadAccess,
      hasWriteAccessAvailable: hasWriteAccessAvailable,
      canChangeWriteAccess: canChangeWriteAccess,
      hasWriteAccess: hasWriteAccess,
      isSelected: hasReadAccess || hasWriteAccess
    });

    this.$el.append(view.render().$el);
    this.addView(view);
  },

  _renderItem: function (model) {
    var self = this;
    var view;
    var o = model.get('model');
    var permission = this._sharePermissionModel;
    var hasWriteAccessAvailable = !self._isVisualization;
    var canChangeWriteAccess = permission.canChangeWriteAccess(model);
    var hasWriteAccess = permission.hasWriteAccess(model);
    var canChangeReadAccess = permission.canChangeReadAccess(model);
    var hasReadAccess = permission.hasReadAccess(model);

    if (model.id !== this._currentUserId) {
      view = new PermissionView({
        model: model,
        permission: permission,
        name: model.get('name'),
        avatar: model.get('avatar_url'),
        role: o.viewer ? _t('components.modals.publish.share.role.viewer') : _t('components.modals.publish.share.role.builder'),
        canChangeReadAccess: canChangeReadAccess,
        hasReadAccess: hasReadAccess,
        hasWriteAccessAvailable: hasWriteAccessAvailable,
        canChangeWriteAccess: canChangeWriteAccess,
        hasWriteAccess: hasWriteAccess,
        isSelected: hasReadAccess || hasWriteAccess
      });

      this.$el.append(view.render().$el);
      this.addView(view);
    }
  }
});
