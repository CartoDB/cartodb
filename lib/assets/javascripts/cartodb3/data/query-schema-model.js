var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped limit 0';

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    query: '',
    status: 'unavailable' //, unfetched, fetching, fetched
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.columnsCollection = new Backbone.Collection([]);

    this.on('change:query', this._onQueryChanged, this);
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  fetch: function (opts) {
    if (!this._promise) {
      var dfd = $.Deferred();
      this._promise = dfd.promise();

      if (this.get('query')) {
        this.set('status', 'fetching');

        opts = opts || {};
        opts.data = {
          api_key: this._configModel.get('api_key'),
          q: this._getSqlApiQueryParam()
        };
        opts.method = this._sql().length > MAX_GET_LENGTH
          ? 'POST'
          : 'GET';
        opts.success = function () {
          dfd.resolve();
        };
        opts.error = function () {
          dfd.reject();
          this._promise = null;
        }.bind(this);

        cdb.core.Model.prototype.fetch.call(this, opts);
      } else {
        dfd.reject();
      }
    }

    return this._promise;
  },

  parse: function (r) {
    var attrs = _.omit(r, ['fields']);

    var columns = _.map(r.fields, function (d, name) {
      return {
        name: name,
        type: d.type
      };
    }, this);
    this.columnsCollection.reset(columns);
    attrs.status = this.columnsCollection.isEmpty() ? 'unavailable' : 'fetched';

    return attrs;
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  _onQueryChanged: function (m, query) {
    this._promise = null;
    this.set('status', query ? 'unfetched' : 'unavailable');
    this.columnsCollection.reset();
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({ sql: this._sql() });
  },

  _sql: function () {
    return this.get('query');
  }

});
