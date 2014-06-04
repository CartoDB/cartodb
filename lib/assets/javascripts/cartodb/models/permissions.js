
/**
 * manages a cartodb permission object, it contains:
 * - owner: an cdb.admin.User instance
 * - acl: a collection which includes the user and their permission.
 *
 *   see https://github.com/Vizzuality/cartodb-management/wiki/multiuser-REST-API#permissions-object
 *
 *   this object is not created to work alone, it should be a member of an object like visualization
 *   table
 */
cdb.admin.Permission = cdb.core.Model.extend({

  initialize: function() {
    this.acl = new Backbone.Collection();
    this.owner = null;
  },

  removePermission: function(user) {
    var aclItem = this._accessForUser(user);
    if (aclItem) {
      this.acl.remove(aclItem);
    }
    return this;
  },

  // adds/sets permissions for an user
  // type can take the folowing values: 
  // - 'r': read only
  // - 'rw': read and write permission
  setPermision: function(user, type) {
    var aclItem = this._accessForUser(user);
    if (aclItem) {
      aclItem.set('type', type);
    } else {
      this.acl.add(new cdb.admin.ACLItem({
        user: user,
        type: type
      }));
    }
    return this;
  },

  _accessForUser : function(user) {
    if (!user) {
      throw new Error("user");
    }
    return this.acl.find(function(u) {
      return u.get('user').get('username') === user.get('username');
    })
  },

  // return permissions for an user, null if the
  // user is not un the acl
  permissionsForUser: function(user) {
    if (!user) {
      throw new Error("user");
    }
    var aclItem = this._accessForUser(user);
    if (aclItem) {
      return aclItem.get('type');
    }
    return null;
  }

});

//TODO: add validation
cdb.admin.ACLItem = Backbone.Model.extend({
  defaults: {
    type: 'r'
  }
});
