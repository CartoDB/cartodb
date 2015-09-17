if (typeof module !== 'undefined') {
  module.exports = {};
}

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
    this._generateAcl();
    this.bind('change:owner', this._generateOwner, this);
    this.bind('change:acl', this._generateAcl, this);
  },

  _generateOwner: function() {
    if (!this.owner) {
      this.owner = new cdb.admin.User();
    }
    this.owner.set(this.get('owner'));
  },

  _generateAcl: function() {
    this.acl.reset([], { silent: true });
    _.each(this.get('acl'), function(aclItem) {
      var model;
      switch (aclItem.type) {
        case 'user':
          model = new cdb.admin.User(aclItem.entity);
          break;
        case 'org':
          model = new cdb.admin.Organization(aclItem.entity);
          break;
        case 'group':
          model = new cdb.admin.Group(aclItem.entity);
          break;
        default:
          throw new Error("Unknown ACL item type: " + aclItem.type);
      }
      this.setPermission(model, aclItem.access);
    }, this);
  },

  cleanPermissions: function() {
    this.acl.reset();
  },

  /**
   * Grants access to a set of items
   * @param {Object,Array} input A single model or an array of models
   * @param {String} access can take the following values:
   * - 'r': read only
   * - 'rw': read and write permission
   */
  grantAccess: function(input, access) {
    _.each(this._inputToArray(input), function(m) {
      var aclItem = this._aclItemForModel(m);
      if (aclItem) {
        aclItem.set('access', access);
      } else {
        aclItem = this._createACLItem(m, access);
        if (aclItem.isValid()) {
          this.acl.add(aclItem);
        } else {
          throw new Error(access + ' is not a valid ACL access');
        }
      }
    }, this);
  },

  /**
   * Grants access to a set of items
   * @param {Object,Array} input A single model or an array of models
   */
  revokeAccess: function(input) {
    _.each(this._inputToArray(input), function(m) {
      var aclItem = this._aclItemForModel(m);
      if (aclItem) {
        this.acl.remove(aclItem);
      }
    }, this);
  },

  /**
   * Retrieve the access for given model, if there is any.
   * @param {Object} model
   * @return {String null} 'r', 'rw', or null if don't have permission
   */
  access: function(model) {
    if (!model) {
      throw new Error('model is required to get access');
    }

    var checkList = ['_ownerAccess', '_entityAccess', '_organizationAccess', '_groupsAccess'];
    var access = this._findMostPrivilegedAccess(checkList, function(fnName) {
      return this[fnName](model);
    });

    return access ? access : null;
  },

  isOwner: function(model) {
    return _.result(this.owner, 'id') === _.result(model, 'id');
  },

  toJSON: function() {
    return {
      entity: this.get('entity'),
      acl: this.acl.toJSON()
    };
  },

  getUsersWithAnyPermission: function() {
    return this.acl.chain()
      .filter(this._hasTypeUser)
      .map(this._getEntity)
      .value();
  },

  isSharedWithOrganization: function() {
    return this.acl.any(this._hasTypeOrg);
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
    return !!this.access(model);
  },

  canWrite: function(model) {
    return this.access(model) === cdb.admin.Permission.READ_WRITE;
  },

  // @deprecated use .grantAccess instead
  setPermission: function() {
    return this.grantAccess.apply(this, arguments);
  },

  // @deprecated use .access instead
  getPermission: function() {
    return this.access.apply(this, arguments);
  },

  // @deprecated use .revokeAccess instead
  removePermission: function() {
    return this.revokeAccess.apply(this, arguments);
  },

  _hasTypeUser: function(m) {
    return m.get('type') === 'user';
  },

  _getEntity: function(m) {
    return m.get('entity');
  },

  _hasTypeOrg: function(m) {
    return m.get('type') === 'org';
  },

  _isOrganization: function(object) {
    return object instanceof cdb.admin.Organization;
  },

  _aclItemForModel: function(model) {
    if (!model || !_.isFunction(model.isNew)) {
      throw new Error('model is required to access model');
    }
    if (!model.isNew()) {
      return this.acl.find(function(aclItem) {
        return aclItem.get('entity').id === model.id;
      });
    }
  },

  _ownerAccess: function(m) {
    if (this.isOwner(m)) {
      return cdb.admin.Permission.READ_WRITE;
    }
  },

  // @param {Object} an instance of a User, Group or Organization
  _entityAccess: function(m) {
    return this._maybeAccessForAclItem(this._aclItemForModel(m));
  },

  _organizationAccess: function(m) {
    var org = _.result(m.collection, 'organization') || m.organization;
    if (org) {
      return this._entityAccess(org);
    }
  },

  _groupsAccess: function(m) {
    if (m.groups) {
      return this._findMostPrivilegedAccess(m.groups, this._entityAccess);
    }
  },

  /**
   * Iterates of list using the iteratee, stops and returns when found the best access (i.e. READ_WRITE), or the
   * list is completed.
   * @param {Array} list
   * @param {Function} iteratee that takes an item from list and returns an access
   *   iteratee is called in context of this model.
   * @Return {String} 'r', 'rw', or undefined if there were no access for given item
   */
  _findMostPrivilegedAccess: function(list, iteratee) {
    var access;
    for (var i = 0, item = list[i]; item && access !== cdb.admin.Permission.READ_WRITE; item = list[++i]) {
      // Keep current access if iteratee returns nothing
      access = iteratee.call(this, item) || access;
    }
    return access;
  },

  // @return {String, undefined} the access if given an aclItem
  _maybeAccessForAclItem: function(aclItem) {
    if (aclItem) {
      return aclItem.get('access');
    }
  },

  _createACLItem: function(model, access) {
    var type;
    if (model instanceof cdb.admin.User) {
      type = 'user'
    } else if (model instanceof cdb.admin.Group) {
      type = 'group';
    } else if (this._isOrganization(model)) {
      type = 'org';
    } else {
      throw new Error('model not recognized as a valid ACL entity ' + model);
    }

    return new cdb.admin.ACLItem({
      type: type,
      entity: model,
      access: access
    });
  },

  _inputToArray: function(input) {
    if (!input) {
      throw new Error("input is required (either a single model or an array of models)");
    }

    var models = input instanceof Backbone.Collection ?
      input.models.slice() // slice to copy array, to not mutate collection by accident
        :
      _.isArray(input) ? input : [input];

    return models;
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
