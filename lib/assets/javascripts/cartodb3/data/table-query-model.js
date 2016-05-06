var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped limit 0';

/**
 * TableQuery model represents a query on top of a table.
 * Works against the SQL API instead of the normal (Rails) REST API.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    query: '',
    fetched: false
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.columnsCollection = new Backbone.Collection([]);
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  fetch: function (opts) {
    opts = opts || {};

    opts.data = {
      api_key: this._configModel.get('api_key'),
      q: this._getSqlApiQueryParam()
    };
    opts.method = this._sql().length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';

    return cdb.core.Model.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    var attrs = _.omit(r, ['fields']);
    attrs.fetched = true;

    var columns = _.map(r.fields, function (d, name) {
      return {
        name: name,
        type: d.type
      };
    }, this);
    this.columnsCollection.reset(columns);

    return attrs;
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({ sql: this._sql() });
  },

  _sql: function () {
    return this.get('query');
  }

});
