const Backbone = require('backbone');
const UserModel = require('dashboard/data/user-model');
const GroupModel = require('dashboard/data/group-model');

// This used to have:
// new cdb.admin[className](this.get('model'));
// We took grantable_presenter types as the truth.

/**
 * Model representing an entity (user, group, etc.) that may share a Visualization.
 * Actual model is wrapped with additional metadata for the grantable context.
 */
module.exports = Backbone.Model.extend({

  initialize: function () {
    this.entity = this._createEntity();
  },

  // @return {Object} instance of the real model this grantable entitity represents
  //   Keep in mind that this returns a new instance of that model (i.e. not a cache version)
  _createEntity: function () {
    let model;
    if (this.get('type') === 'user') {
      model = new UserModel(this.get('model'), {
        // ...configmodel
      });
    } else {
      model = new GroupModel(this.get('model'), {});
    }
    model.organization = this.collection.organization;
    return model;
  }
});
