var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  // In case that there is already an id attribute
  idAttribute: '__id',

  url: function () {
    if (this._tableName && this._configModel) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('record');
      var url = baseUrl + '/api/' + version + '/tables/' + this._tableName + '/records';

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

    this._initBinds();
  },

  _initBinds: function () {
    this.bind('error', this._onError, this);
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
    return _.omit(this.attributes, '__id');
  }

});
