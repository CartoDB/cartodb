var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var errorParse = require('builder/helpers/error-parser');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');

var REQUIRED_OPTS = [
  'configModel',
  'nodeDefModel'
];

module.exports = CustomListCollection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._querySchemaModel = this._nodeDefModel.querySchemaModel;

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    this.stateModel = new Backbone.Model({
      state: 'unfetched'
    });

    CustomListCollection.prototype.initialize.call(this, models, options);
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

  buildQuery: function () {
    throw new Error('subclasses of DataObservatoryBaseCollection must implement buildQuery');
  },

  fetch: function (options) {
    this._success = options && options.success;
    this._error = options && options.error;

    var defaults = {
      filters: null,
      measurement: null,
      normalize: null,
      timespan: null,
      query: this._querySchemaModel.get('query')
    };

    this.deferred = $.Deferred();
    var queryOptions = _.defaults(options, defaults);
    var sqlQuery = this.buildQuery(queryOptions);

    this.stateModel.set('state', 'fetching');
    this.SQL.execute(sqlQuery, queryOptions, {
      success: function (data) {
        this._onFetchSuccess(data);
        this.stateModel.set('state', 'fetched');
        this.deferred.resolve();
        this._success && this._success();
      }.bind(this),
      error: function (err) {
        this.stateModel.set('state', 'error');
        this.deferred.reject();
        this._error && this._error(errorParse(err));
      }.bind(this)
    });

    return this.deferred.promise();
  },

  _onFetchSuccess: function (data) {
    var models = data.rows;
    this.reset(models);
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
