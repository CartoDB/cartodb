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

  initialize: function () {
    this.collection = this.collection || {};

    this._tableName = this.collection._tableName;
    this._configModel = this.collection._configModel;

    this._initBinds();
  },

  _initBinds: function () {
    this.bind('error', this._onError, this);
  },

  isNew: function () {
    return !this.has('cartodb_id');
  },

  _onError: function () {
    this.set(this.previousAttributes());
  },

  save: function (attrs, opts) {
    var errorCallback = opts.error;
    opts.error = function (e) {
      errorCallback && errorCallback(e);
      this.trigger('error', e, this);
    }.bind(this);

    return Backbone.Model.prototype.save.call(this, opts);
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
