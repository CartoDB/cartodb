const _ = require('underscore');
const result = require('builder/helpers/utils').result;
const Backbone = require('backbone');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');
const GroupModel = require('dashboard/data/group-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

// Nobody else uses this, and it would incur on a circular dependency if moved to a file
const ACLItemModel = Backbone.Model.extend({
  defaults: {
    access: 'r'
  },

  isOwn: function (model) {
    return model.id === this.get('entity').id;
  },

  validate: function (attrs, options) {
    var p = PermissionModel;
    if (attrs.access !== p.READ_ONLY && attrs.access !== p.READ_WRITE) {
      return "access can't take 'r' or 'rw' values";
    }
  },

  toJSON: function () {
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

const REQUIRED_OPTS = [
  'configModel'
];

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
const PermissionModel = Backbone.Model.extend({
  urlRoot: '/api/v1/perm',

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.acl = new Backbone.Collection();
    this.owner = null;
    this._generateOwner();
    this._generateAcl();
    this.bind('change:owner', this._generateOwner, this);
    this.bind('change:acl', this._generateAcl, this);
  },

  _generateOwner: function () {
    if (!this.owner) {
      this.owner = new UserModel(undefined, { configModel: this._configModel });
    }
    this.owner.set(this.get('owner'));
  },

  _generateAcl: function () {
    this.acl.reset([], { silent: true });
    _.each(this.get('acl'), function (aclItem) {
      var model;
      switch (aclItem.type) {
        case 'user':
          model = new UserModel(aclItem.entity, { configModel: this._configModel });
          break;
        case 'org':
          model = new OrganizationModel(aclItem.entity, { configModel: this._configModel });
          break;
        case 'group':
          model = new GroupModel(aclItem.entity, { configModel: this._configModel });
          break;
        default:
          throw new Error('Unknown ACL item type: ' + aclItem.type);
      }
      this._grantAccess(model, aclItem.access);
    }, this);
  },

  cleanPermissions: function () {
    this.acl.reset();
  },

  hasAccess: function (model) {
    // Having at least read access is the same as having any access
    return this.hasReadAccess(model);
  },

  hasReadAccess: function (model) {
    // If there is a representable ACL item it must be one of at least READ_ONLY access
    return !!this.findRepresentableAclItem(model);
  },

  hasWriteAccess: function (model) {
    var access = result(this.findRepresentableAclItem(model), 'get', 'access');
    return access === PermissionModel.READ_WRITE;
  },

  canChangeReadAccess: function (model) {
    return this._canChangeAccess(model);
  },

  canChangeWriteAccess: function (model) {
    return (!model.isBuilder || model.isBuilder()) && this._canChangeAccess(model, function (representableAclItem) {
      return result(representableAclItem, 'get', 'access') !== PermissionModel.READ_WRITE;
    });
  },

  _canChangeAccess: function (model) {
    var representableAclItem = this.findRepresentableAclItem(model);
    return this.isOwner(model) || !representableAclItem ||
      representableAclItem === this._ownAclItem(model) || result(arguments, 1, representableAclItem) || false;
  },

  grantWriteAccess: function (model) {
    this._grantAccess(model, this.constructor.READ_WRITE);
  },

  grantReadAccess: function (model) {
    this._grantAccess(model, this.constructor.READ_ONLY);
  },

  revokeWriteAccess: function (model) {
    // Effectively "downgrades" to READ_ONLY
    this.grantReadAccess(model);
  },

  /**
   * Revokes access to a set of items
   * @param {Object} model A single model or an array of models
   */
  revokeAccess: function (model) {
    var aclItem = this._ownAclItem(model);
    if (aclItem) {
      this.acl.remove(aclItem);
    }
  },

  getOwner: function () {
    return this.owner;
  },

  isOwner: function (model) {
    return _.result(this.owner, 'id') === _.result(model, 'id');
  },

  toJSON: function () {
    return {
      entity: this.get('entity'),
      acl: this.acl.toJSON()
    };
  },

  getUsersWithAnyPermission: function () {
    return this.acl.chain()
      .filter(this._hasTypeUser)
      .map(this._getEntity)
      .value();
  },

  isSharedWithOrganization: function () {
    return this.acl.any(this._hasTypeOrg);
  },

  clone: function () {
    var attrs = _.clone(this.attributes);
    delete attrs.id;
    return new PermissionModel(attrs, { configModel: this._configModel });
  },

  /**
   * Overwrite this ACL list from other permission object
   * @param otherPermission {Object} instance of PermissionModel
   */
  overwriteAcl: function (otherPermission) {
    this.acl.reset(otherPermission.acl.models);
  },

  // Note that this may return an inherited ACL item
  // use ._ownAclItem instead if only model's own is wanted (if there is any)
  findRepresentableAclItem: function (model) {
    if (this.isOwner(model)) {
      return this._newAclItem(model, this.constructor.READ_WRITE);
    } else {
      var checkList = ['_ownAclItem', '_organizationAclItem', '_mostPrivilegedGroupAclItem'];
      return this._findMostPrivilegedAclItem(checkList, function (fnName) {
        return this[fnName](model);
      });
    }
  },

  _hasTypeUser: function (m) {
    return m.get('type') === 'user';
  },

  _getEntity: function (m) {
    return m.get('entity');
  },

  _hasTypeOrg: function (m) {
    return m.get('type') === 'org';
  },

  _isOrganization: function (object) {
    return object instanceof OrganizationModel;
  },

  _ownAclItem: function (model) {
    if (!model || !_.isFunction(model.isNew)) {
      console.error('model is required to find an ACL item');
    }
    if (!model.isNew()) {
      return this.acl.find(function (aclItem) {
        return aclItem.get('entity').id === model.id;
      });
    }
  },

  _organizationAclItem: function (m) {
    var org = _.result(m.collection, 'organization') || m.organization;
    if (org) {
      return this._ownAclItem(org);
    }
  },

  _mostPrivilegedGroupAclItem: function (m) {
    var groups = _.result(m.groups, 'models');
    if (groups) {
      return this._findMostPrivilegedAclItem(groups, this._ownAclItem);
    }
  },

  /**
   * Iterates over a items in given list using the iteratee, stops and returns when found the ACL item with best access (i.e. READ_WRITE), or the
   * list is completed.
   * @param {Array} list
   * @param {Function} iteratee that takes an item from list and returns an access
   *   iteratee is called in context of this model.
   * @Return {String} 'r', 'rw', or undefined if there were no access for given item
   */
  _findMostPrivilegedAclItem: function (list, iteratee) {
    var aclItem;
    for (var i = 0, x = list[i]; x && result(aclItem, 'get', 'access') !== PermissionModel.READ_WRITE; x = list[++i]) {
      // Keep last ACL item if iteratee returns nothing
      aclItem = iteratee.call(this, x) || aclItem;
    }
    return aclItem;
  },

  /**
   * Grants access to a set of items
   * @param {Object} model
   * @param {String} access can take the following values:
   * - 'r': read only
   * - 'rw': read and write permission
   */
  _grantAccess: function (model, access) {
    var aclItem = this._ownAclItem(model);
    if (aclItem) {
      aclItem.set('access', access);
    } else {
      aclItem = this._newAclItem(model, access);
      if (aclItem.isValid()) {
        this.acl.add(aclItem);
      } else {
        throw new Error(access + ' is not a valid ACL access');
      }
    }
  },

  _newAclItem: function (model, access) {
    const type = model.get('type') || model.getModelType();

    return new ACLItemModel({
      type: type,
      entity: model,
      access: access
    });
  }

}, {

  READ_ONLY: 'r',
  READ_WRITE: 'rw'

});

module.exports = PermissionModel;
