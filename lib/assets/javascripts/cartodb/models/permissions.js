
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


  urlRoot: '/api/v1/perm',

  initialize: function() {
    this.acl = new Backbone.Collection();
    this.owner = null;
    if (this.get('owner')) {
      this.owner = new cdb.admin.User(this.get('owner'));
    }

    if (this.get('acl')) {
      var acl = this.get('acl');
      for (var i = 0; i < acl.length; ++i) {
        var aclitem = acl[i];
        if (aclitem.type === 'user') {
          this.setPermission(new cdb.admin.User(aclitem.entity), aclitem.access);
        } else {
          // org
          var org = new cdb.admin.Organization(aclitem.entity);
          this.setPermission(org, aclitem.access);
        }
      }
    }
  },

  // remove permissions for an user
  // or a user collection.
  removePermission: function(user) {
    if (!user) {
      throw new Error("can't remove permission, user undefined");
    }

    if (user.models && user.length !== undefined) {
      // Collection?
      var self = this;
      user.each(function(u){
        self.removePermission(u);
      });
    } else {
      // Model?
      var aclItem = this._accessForUser(user);
      if (aclItem) {
        this.acl.remove(aclItem);
      }  
    }
    
    return this;
  },

  // Empty the acl collection
  cleanPermissions: function() {
    this.acl.reset();
  },

  // Create a new ACLItem
  // - Private method
  _createACLItem: function(u, access) {
    if (u instanceof cdb.admin.User) {
      return new cdb.admin.ACLItem({ type: 'user', entity: u, access: access});
    }
    return new cdb.admin.ACLItem({ type: 'org', entity: u, access: access});
  },

  // adds/sets permissions for an user
  // or a user collection.
  // access can take the folowing values: 
  // - 'r': read only
  // - 'rw': read and write permission
  setPermission: function(user, access) {
    if (!user) {
      throw new Error("can't apply permission, user undefined");
    }

    if (user.models && user.length !== undefined) {
      // Collection?
      if (user.length === 0) {
        cdb.log.info('Users collection is empty, can\'t apply any permission');
        return false;
      }
      var self = this;
      user.each(function(u) {
        self.setPermission(u, access);
      });
    } else {
      // Model?
      var aclItem = this._accessForUser(user);
      if (aclItem && aclItem.get('entity').id === user.id) {
        aclItem.set('access', access);
      } else {
        aclItem = this._createACLItem(user, access);
        if (!aclItem.isValid()) throw new Error("invalid acl");
        this.acl.add(aclItem);
      }
    }

    return this;
  },

  _accessForUser : function(user) {
    if (!user) {
      throw new Error("user");
    }
    return this.acl.find(function(u) {
      return u.get('entity').id === user.id;
    });
  },

  

  // return permissions for an user, null if the
  // user is not un the acl
  permissionsForUser: function(user) {
    if (!user) {
      throw new Error("user");
    }

    var aclItem = this._accessForUser(user);
    if (aclItem) {
      return aclItem.get('access');
    } else {
      // get permissions for org
      var orgAcl = _.find(this.acl.where({
        type: 'org'
      }), function(org) {
        return org.get('entity').containsUser(user);
      });
      if (orgAcl) {
        return orgAcl.get('access');
      }
    }
    return null;
  },

  toJSON: function() {
    return {
      entity: this.get('entity'),
      acl: this.acl.toJSON()
    };
  }

}, {

  READ_ONLY: 'r',
  READ_WRITE: 'rw',
  NONE: 'n',

});

//TODO: add validation
cdb.admin.ACLItem = Backbone.Model.extend({
  defaults: {
    access: 'r'
  },

  validate: function(attrs, options) {
    var p = cdb.admin.Permission;
    if (attrs.access !== p.READ_ONLY && attrs.access !== p.READ_WRITE && attrs.access !== p.NONE) {
      return "access can't take 'r', 'rw' or 'n' values";
    }
  },

  toJSON: function() {
    return {
      type: 'user',
      entity: _.pick(this.get('entity').toJSON(), 'id', 'username'),
      access: this.get('access')
    };
  }
});
