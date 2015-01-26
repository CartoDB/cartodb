var Backbone = require('backbone');
var _ = require('underscore');
var OrgPermission = require('./org_permission_model');
var UserPermission = require('./user_permission_model');

/**
 * Collection that holds the different privacy options.
 */
module.exports = Backbone.Collection.extend({
  
  initialize: function() {
    // TODO keep models in sync w/ organization model?
  },

  usersCount: function() {
    return this.filter(function(m) {
      return m instanceof UserPermission;
    }).length;
  }

}, { // Class properties:
  
  byPermission: function(visPermission, currentUserOrg) {
    var models = currentUserOrg.users.map(function(user) {
      return new UserPermission({
        user: user,
        permission: visPermission.getPermission(user)
      });
    }, this);

    models.unshift(new OrgPermission({
      org: currentUserOrg,
      permission: visPermission.getPermission(currentUserOrg)
    }));
    
    return new this(models);
  }
});


