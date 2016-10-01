var Backbone = require('backbone');
var _ = require('underscore');
var PermissionModel = require('./permission-model');
var OWN_ATTR_NAMES = ['id', 'username', 'avatar_url', 'name'];

module.exports = Backbone.Model.extend({
  defaults: {
    access: 'r'
  },

  isOwn: function (model) {
    return model.id === this.get('entity').id;
  },

  validate: function (attrs, options) {
    if (attrs.access !== PermissionModel.READ_ONLY && attrs.access !== PermissionModel.READ_WRITE) {
      return "access can't take 'r' or 'rw' values";
    }
  },

  toJSON: function () {
    var entity = _.pick(this.get('entity').toJSON(), OWN_ATTR_NAMES);
    // translate name to username
    if (!entity.username) {
      entity.username = entity.name;
      delete entity.name;
    }
    return {
      type: this.get('type') || 'user',
      entity: entity,
      access: this.get('access')
    };
  }
});
