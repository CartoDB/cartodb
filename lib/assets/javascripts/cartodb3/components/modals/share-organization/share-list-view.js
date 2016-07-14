var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PermissionView = require('./share-permission-view');

var REQUIRED_OPTS = [
  'collection',
  'currentUserId',
  'hasOrganization',
  'visDefinitionModel'
];

module.exports = CoreView.extend({
  className: 'Share-list',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    if (this._hasOrganization) {
      this._renderOrganization();
    }

    this._collection.each(this._renderItem, this);
  },

  _renderOrganization: function () {
    var self = this;
    var view = new PermissionView({
      permission: {},
      description: 'New users will have this permission',
      name: 'Default settings for your Organization',
      hasReadAccess: true,
      hasWriteAccessAvailable: !self._visDefinitionModel.isVisualization(),
      hasWriteAccess: true
    });

    this.$el.append(view.render().$el);
    this.addView(view);
  },

  _renderItem: function (model) {
    var self = this;
    var view;

    if (model.id !== this._currentUserId) {
      view = new PermissionView({
        permission: {},
        name: model.get('name'),
        avatar: model.get('avatar_url'),
        role: model.get('viewer') ? 'Viewer' : 'Builder',
        hasReadAccess: true,
        hasWriteAccessAvailable: !self._visDefinitionModel.isVisualization(),
        hasWriteAccess: true
      });

      this.$el.append(view.render().$el);
      this.addView(view);
    }
  }
});
