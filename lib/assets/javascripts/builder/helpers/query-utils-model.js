var _ = require('underscore');
var Backbone = require('backbone');

var COUNT_SQL_TEMPLATE = 'select count(*) from (<%= subquery %>) st';

module.exports = Backbone.Collection.extend({

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  initialize: function (opts) {
    opts = opts || {};

    this._subquery = opts.subquery;
    this._configModel = opts.configModel;
  },

  fetchCount: function (callback) {
    var opts = {};
    var count = -1;

    opts.data = {
      api_key: this._configModel.get('api_key'),
      q: this._getCountSQL()
    };
    opts.method = this._httpMethod();
    opts.error = function (coll, resp) {
      callback && callback(count);
    };
    opts.success = function (coll, resp, options) {
      if (resp.rows && resp.rows.length) {
        count = resp.rows[0].count;
      }
      callback && callback(count);
    };

    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  _getCountSQL: function (excludeColumns) {
    return _.template(COUNT_SQL_TEMPLATE)({
      subquery: this._subquery
    });
  },

  _httpMethod: function () {
    return 'GET';
  }
});
