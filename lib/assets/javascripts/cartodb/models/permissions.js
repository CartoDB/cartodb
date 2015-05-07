
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
    this._generateOwner();
    this._genetateAcl();
    this.bind('change:owner', this._generateOwner, this);
    this.bind('change:acl', this._genetateAcl, this);
  },

  _generateOwner: function() {
    if (this.owner) {
      this.owner.set(this.get('owner'));
    } else {
      this.owner = new cdb.admin.User(this.get('owner'));
    }
  },

  _genetateAcl: function() {
    this.acl.reset([], { silent: true });

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
  // or a users collection.
  removePermission: function(users) {
    var self = this;

    if (!users) {
      throw new Error("can't remove permission, user undefined");
    }

    if (users instanceof Backbone.Collection) {
      users = users.models;
    }
    // Convert into array if it isn't.
    users = _.isArray(users) ? users.slice() : [users];

    // Check organization item can't be in the same array with a users item
    var isOrgAndUser = users.length > 1 && _.find(users, function(i) { return !i instanceof cdb.admin.User });
    if (isOrgAndUser) {
      throw new Error("can't remove permission for a user and organization at the same time");
    }

    // If model is user type and there is an organization,
    // remove organization from acl and set user permissions
    // from organization
    var isOrg = _.find(users, function(i) { return i instanceof cdb.admin.Organization});
    var aclOrg = this.acl.find(function(i) { return i.get('type') === "org"; });

    if (!isOrg) {
      // Org perm
      if (aclOrg) {
        var perm = aclOrg.get('access');
        var org_users = aclOrg.get('entity').users;

        // Remove organization
        this.acl.remove(aclOrg);

        // Add permission from organization to
        // rest of users, but not for the current-one
        org_users.each(function(u) {
          if (_.contains(users, u)) {
            self.acl.remove(self._accessForUser(u));
          } else {
            self.setPermission(u, perm);
          }
        });
      } else {
        _(users).each(function(u) {
          self.acl.remove(self._accessForUser(u));
        });
      }

    } else {
      this.cleanPermissions();
    }
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
  setPermission: function(users, access) {
    var self = this;

    if (!users) {
      throw new Error("can't apply permission, user undefined");
    }

    if (users instanceof Backbone.Collection) {
      users = users.models;
    }
    // Convert into array if it isn't.
    users = _.isArray(users) ? users.slice() : [users];

    // Check organization item can't be in the same array with a user item
    var isOrgAndUser = users.length > 1 && _.find(users, function(i) { return i instanceof cdb.admin.User === false });
    if (isOrgAndUser) {
      throw new Error("can't change permission for a user and organization at the same time");
    }

    var org = _.find(users, function(i) { return i instanceof cdb.admin.User === false });

    // If action is for a user
    if (!org) {
      // - Get organization permission
      var acl_org = this.acl.find(function(i) { return i.get('type') === "org" });

      if (acl_org) {
        this.acl.remove(acl_org);
        // add to the user list add the users with the current org permission
        var org_access = acl_org.get('access');
        acl_org.get('entity').users.each(function (u) {
          if (!_.contains(users, u)) {
            aclItem = self._createACLItem(u, org_access);
            self.acl.add(aclItem);
          }
        });
      }
    } else {
      // If action if for an organization
      // - Remove all org users permission
      this.acl.reset([], { silent: true });
    }
      // - Create or set perm
      _.each(users, function(u){
        var aclItem = self._accessForUser(u);
        if (aclItem && aclItem.get('entity').id === u.id) {
          aclItem.set('access', access);
        } else {
          aclItem = self._createACLItem(u, access);
          if (!aclItem.isValid()) throw new Error("invalid acl");
          self.acl.add(aclItem);
        }
      });
  },

  _accessForUser : function(user) {
    if (!user) {
      throw new Error("user");
    }
    return this.acl.find(function(u) {
      return u.get('entity').id === user.id;
    });
  },



  // return permissions for an user or organization,
  // null if the user is not un the acl
  getPermission: function(user) {
    if (!user) {
      throw new Error("user");
    }

    // check ownership
    if (this.isOwner(user)) {
      return cdb.admin.Permission.READ_WRITE;
    }

    var aclItem = this._accessForUser(user);
    if (aclItem) {
      return aclItem.get('access');
    } else {
      // get permissions for org
      var orgAcl = _.find(this.acl.where({
        type: 'org'
      }), function(org) {
        return user.organization && user.organization.id === org.get('entity').id;
      });
      if (orgAcl) {
        return orgAcl.get('access');
      }
    }
    return null;
  },

  // Check if user is the owner of this permission
  isOwner: function(user) {
    if (!user) {
      throw new Error("user");
    }

    if (!this.owner) {
      return false;
    }
    return this.owner.get('id') === user.get('id');
  },

  toJSON: function() {
    return {
      entity: this.get('entity'),
      acl: this.acl.toJSON()
    };
  },

  getUsersWithPermission: function(t) {
    return this.acl.filter(function(u) {
      return u.get('type') === t;
    }).map(function(u) {
      return u.get('entity');
    });
  },

  getUsersWithAnyPermission: function() {
    return this.acl.map(function(u) {
      return u.get('entity');
    });
  },

  isSharedWithOrganization: function() {
    return this.acl.any(function(u) {
      return u.get('type') === 'org';
    });
  },

  clone: function() {
    var attrs = _.clone(this.attributes);
    delete attrs.id;
    return new cdb.admin.Permission(attrs);
  },

  /**
   * Overwrite this ACL list from other permission object
   * @param otherPermission {Object} instance of cdb.admin.Permission
   */
  overwriteAcl: function(otherPermission) {
    this.acl.reset(otherPermission.acl.models);
  },

  canRead: function(model) {
    var access = this.getPermission(model);
    return access === cdb.admin.Permission.READ_ONLY || access === cdb.admin.Permission.READ_WRITE;
  },

  canWrite: function(model) {
    return this.getPermission(model) === cdb.admin.Permission.READ_WRITE;
  }

}, {

  READ_ONLY: 'r',
  READ_WRITE: 'rw'

});

//TODO: add validation
cdb.admin.ACLItem = Backbone.Model.extend({
  defaults: {
    access: 'r'
  },

  validate: function(attrs, options) {
    var p = cdb.admin.Permission;
    if (attrs.access !== p.READ_ONLY && attrs.access !== p.READ_WRITE) {
      return "access can't take 'r' or 'rw' values";
    }
  },

  toJSON: function() {
    var entity = _.pick(this.get('entity').toJSON(), 'id', 'username', 'avatar_url', 'name');
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
