var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  // In case that there is already an id attribute
  idAttribute: '__id',

  url: function () {
    if (this._tableName && this._configModel) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('record');
      var url = baseUrl + '/api/' + version + '/tables/';

      if (this.hasWriteAccess(this._userModel) && !this.isOwner(this._userModel)) {
        var owner = this._permissionModel.getOwner();
        var ownerUsername = owner.get('username');

        url += ownerUsername + '.' + this._tableName + '/records';
      } else {
        url += this._tableName + '/records';
      }

      if (!this.isNew()) {
        url += '/' + this.get('cartodb_id');
      }

      return url;
    }

    return false;
  },

  initialize: function (attrs, opts) {
    this.collection = this.collection || {};

    this._tableName = opts.tableName || this.collection._tableName;
    this._configModel = opts.configModel || this.collection._configModel;
    this._permissionModel = opts.permissionModel || this.collection._permissionModel;
    this._userModel = opts.userModel || this.collection._userModel;

    this._initBinds();
  },

  _initBinds: function () {
    this.bind('error', this._onError, this);
  },

  hasWriteAccess: function (userModel) {
    if (!userModel || !this._permissionModel) {
      return false;
    }
    return this._permissionModel.hasWriteAccess(userModel);
  },

  isOwner: function (userModel) {
    if (!userModel || !this._permissionModel) {
      return false;
    }
    return this._permissionModel.isOwner(userModel);
  },

  isNew: function () {
    return !this.has('cartodb_id');
  },

  isGeomLoaded: function () {
    try {
      JSON.parse(this.get('the_geom'));
      return true;
    } catch (e) {
      return false;
    }
  },

  fetchRowIfGeomIsNotLoaded: function (callback) {
    if (this.isGeomLoaded()) {
      callback();
      return;
    }

    this.fetch({
      success: callback
    });
  },

  _onError: function () {
    this.set(this.previousAttributes());
  },

  sync: function () {
    this.trigger('loading', this);
    Backbone.Model.prototype.sync.apply(this, arguments);
  },

  parse: function (attrs) {
    if (!attrs.__id) {
      attrs.__id = _.uniqueId();
    }
    return attrs;
  },

  toJSON: function () {
    return _.omit(
      this.attributes,
      '__id',
      'the_geom_webmercator'
    );
  }

});
