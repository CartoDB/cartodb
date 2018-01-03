var Backbone = require('backbone');
var checkAndBuildOpts = require('../helpers/required-opts');
var STATES = require('./query-base-status');

var CONTEXTS = {
  MAP: 'map',
  TABLE: 'table'
};

var REQUIRED_OPTS = [
  'querySchemaModel',
  'queryGeometryModel',
  'queryRowsCollection'
];

var LayerContentModel = Backbone.Model.extend({
  defaults: {
    context: CONTEXTS.MAP, // map or table
    state: STATES.fetching
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  isErrored: function () {
    return this.get('state') === STATES.errored ||
      this._querySchemaModel.hasRepeatedErrors() ||
      this._queryGeometryModel.hasRepeatedErrors() ||
      this._queryRowsCollection.hasRepeatedErrors();
  },

  isFetching: function () {
    return this.get('state') === STATES.fetching ||
      !this._querySchemaModel.isFetched() ||
      !this._queryGeometryModel.isFetched() ||
      !this._queryRowsCollection.isFetched();
  },

  isFetched: function () {
    return this.get('state') === STATES.fetched &&
      this._querySchemaModel.isFetched() &&
      this._queryGeometryModel.isFetched() &&
      this._queryRowsCollection.isFetched();
  }
});

LayerContentModel.CONTEXTS = CONTEXTS;
LayerContentModel.STATES = STATES;

module.exports = LayerContentModel;
