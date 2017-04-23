var Backbone = require('backbone');
var _ = require('underscore');
var cdb = require('cartodb.js');
var errorParse = require('../../helpers/error-parser');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'layerDefinitionModel'
];

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._querySchemaModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel;

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    this._state = 'unfetched';
  },

  fetch: function (options) {
    this._success = options && options.success;
    this._error = options && options.error;

    var defaults = {
      region: 'NULL',
      measurement: 'NULL',
      normalize: 'NULL',
      timespan: 'NULL'
    };

    var query = this._querySchemaModel.get('query');
    var queryOptions = _.defaults(options, defaults);

    var sqlQuery = this._queryTemplate({
      query: query
    });

    if (!this.isFetching()) {
      this._state = 'fetching';
      this.SQL.execute(sqlQuery, queryOptions, {
        success: function (data) {
          this._state = 'fetched';
          this._onFetchSuccess(data);
          this._success && this._success();
        }.bind(this),
        error: function (err) {
          this._state = 'error';
          this._error && this._error(errorParse(err));
        }.bind(this)
      });
    }
  },

  _onFetchSuccess: function (data) {
    var models = data.rows;
    this.reset(models);
  },

  isFetching: function () {
    return this.getState() === 'fetching';
  },

  getState: function () {
    return this._state;
  },

  // these methods below is to use this collection as base collection for custom list view.
  getItem: function (value) {
    return this.findWhere({ val: value });
  },

  setSelected: function (value) {
    var selectedModel;
    var silent = { silent: true };

    this.each(function (mdl) {
      if (mdl.getValue() === value) {
        mdl.set({
          selected: true
        });
        selectedModel = mdl;
      } else {
        mdl.set({
          selected: false
        }, silent);
      }
    });
    return selectedModel;
  },

  getSelectedItem: function () {
    return _.first(this.getSelected());
  },

  getSelected: function () {
    return this.filter(function (mdl) {
      return mdl.get('selected') === true;
    });
  },

  removeSelected: function () {
    this.each(function (mdl) {
      mdl.set({
        selected: false
      });
    });
  }
});
