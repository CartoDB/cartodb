
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

  READ_ONLY: 'r',
  READ_WRITE: 'rw',
  
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
        this.setPermission(new cdb.admin.User(aclitem.user), aclitem.type);
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
      var items = [];
      var self = this;
      user.each(function(u){
        var aclItem = self._accessForUser(u);
        if (aclItem) items.push(aclItem);
      });

      if (items.length === 0) {
        cdb.log.info('Users collection is empty, can\'t remove any permission');
        return false;
      }

      this.acl.remove(items)
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
  _createACLItem: function(u, type) {
    return new cdb.admin.ACLItem({ user: u, type: type });
  },

  // adds/sets permissions for an user
  // or a user collection.
  // type can take the folowing values: 
  // - 'r': read only
  // - 'rw': read and write permission
  setPermission: function(user, type) {
    if (!user) {
      throw new Error("can't apply permission, user undefined");
    }

    if (user.models && user.length !== undefined) {
      // Collection?
      var items = [];
      var self = this;
      user.each(function(u){
        var item = self._createACLItem(u, type);
        if (!item.isValid()) throw new Error("invalid acl");
        items.push(item);
      });

      if (items.length === 0) {
        cdb.log.info('Users collection is empty, can\'t apply any permission');
        return false;
      }

      this.acl.reset(items)
    } else {
      // Model?
      var aclItem = this._accessForUser(user);
      if (aclItem) {
        aclItem.set('type', type);
      } else {
        aclItem = this._createACLItem(user, type);
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
  },

  toJSON: function() {
    return {
      acl: this.acl.toJSON()
    };
  }

});

//TODO: add validation
cdb.admin.ACLItem = Backbone.Model.extend({
  defaults: {
    type: 'r'
  },

  validate: function(attrs, options) {
    if (attrs.type !== 'r' && attrs.type !== 'rw') {
      return "type can't take 'r' or 'rw' values";
    }
  },

  toJSON: function() {
    return {
      user: _.pick(this.get('user').toJSON(), 'id', 'username'),
      type: this.get('type')
    };
  }
});
