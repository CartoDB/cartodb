var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var queryTemplate = _.template("SELECT DISTINCT <%= column %> FROM (<%= sql %>) _table_sql WHERE <%= column %>::text ilike '%<%= search %>%' ORDER BY <%= column %> ASC");

var REQUIRED_OPTS = [
  'configModel',
  'rowModel',
  'column'
];

module.exports = CustomListCollection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._query = options.nodeDefModel.querySchemaModel.get('query');

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    this.stateModel = new Backbone.Model({
      state: _.isEmpty(models) ? 'empty' : 'fetched'
    });

    CustomListCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var key = Object.keys(attrs)[0];
    var o = {};
    o.val = attrs[key];
    o.label = attrs[key];

    return new BaseModel(o);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (this.type === 'multiple') {
      return;
    }

    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid) {
          m.set({ selected: false }, { silent: true });
        }
      }, this);
    }
  },

  buildQuery: function (search) {
    var column = this.options.column;
    return queryTemplate({
      sql: this._query,
      search: search,
      column: this._rowModel.get(column)
    });
  },

  fetch: function (search) {
    this.deferred = $.Deferred();
    var sqlQuery = this.buildQuery(search);
    this.stateModel.set('state', 'fetching');

    this.SQL.execute(sqlQuery, null, {
      extra_params: ['page', 'rows_per_page'],
      page: 0,
      rows_per_page: 40,
      success: function (data) {
        this._onFetchSuccess(data);
        this.stateModel.set('state', 'fetched');
        this.deferred.resolve();
      }.bind(this),
      error: function () {
        this.stateModel.set('state', 'error');
        this.deferred.reject();
      }.bind(this)
    });

    return this.deferred.promise();
  },

  _onFetchSuccess: function (data) {
    this.reset(data.rows);
    if (_.isEmpty(this.models)) {
      this.stateModel.set('state', 'empty');
    }
  },

  isFetching: function () {
    return this.getState() === 'fetching';
  },

  getState: function () {
    return this.stateModel.get('state');
  },

  getItem: function (value) {
    return this.findWhere({ val: value });
  },

  isAsync: function () {
    return true;
  }
});
