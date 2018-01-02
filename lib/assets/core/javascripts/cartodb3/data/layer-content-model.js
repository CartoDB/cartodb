var Backbone = require('Backbone');
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
    state: STATES.loading
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  hasError: function () {
    return this.get('state') === STATES.error ||
      this._querySchemaModel.hasRepeatedErrors() ||
      this._queryGeometryModel.hasRepeatedErrors() ||
      this._queryRowsCollection.hasRepeatedErrors();
  },

  isLoading: function () {
    return this.get('state') === STATES.loading ||
      !this._querySchemaModel.isFetched() ||
      !this._queryGeometryModel.isFetched() ||
      !this._queryRowsCollection.isFetched();
  },

  isReady: function () {
    return this.get('state') === STATES.ready &&
      this._querySchemaModel.isFetched() &&
      this._queryGeometryModel.isFetched() &&
      this._queryRowsCollection.isFetched();
  }
});

LayerContentModel.CONTEXTS = CONTEXTS;
LayerContentModel.STATES = STATES;

module.exports = LayerContentModel;
