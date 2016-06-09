var Backbone = require('backbone');
var QueryRowModel = require('./query-row-model');
var syncAbort = require('./backbone/sync-abort');
var _ = require('underscore');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped';
var DEFAULT_FETCH_OPTIONS = {
  rows_per_page: 40,
  sort_order: 'asc',
  order_by: 'cartodb_id'
};

module.exports = Backbone.Collection.extend({

  idAttribute: '',

  // Due to a problem how Backbone checks if there is a model
  // is duplicated or not, we can't create the model with a function
  model: QueryRowModel,

  sync: syncAbort,

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._tableName = opts.tableName;
    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._initBinds();
  },

  comparator: function (rowModel) {
    return rowModel.get('cartodb_id');
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', function (mdl, status) {
      if (status === 'fetched') {
        this.reset(
          this._parseWith__id(this._querySchemaModel.rowsSampleCollection.toJSON())
        );
      }
    }, this);
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({
      sql: this._querySchemaModel.get('query')
    });
  },

  _httpMethod: function () {
    return this._querySchemaModel.get('query').length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  },

  fetch: function (opts) {
    this.trigger('loading');

    opts = opts || {};
    opts.data = _.extend(
      opts.data || {},
      {
        api_key: this._configModel.get('api_key'),
        q: this._getSqlApiQueryParam()
      },
      DEFAULT_FETCH_OPTIONS
    );

    opts.method = this._httpMethod();
    opts.error = function (e) {
      this.trigger('error', e, this);
    }.bind(this);

    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    return this._parseWith__id(r.rows);
  },

  _parseWith__id: function (array) {
    return _.map(array, function (attrs) {
      attrs.__id = _.uniqueId();
      return attrs;
    });
  },

  addRow: function (opts) {
    opts = opts || {};
    this.create(
      {
        __id: _.uniqueId()
      },
      _.extend(
        opts,
        {
          wait: true,
          parse: true
        }
      )
    );
  }

});
