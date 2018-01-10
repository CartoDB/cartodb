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
    state: STATES.unavailable
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:status', this._setState);
    this.listenTo(this._queryGeometryModel, 'change:status', this._setState);
    this.listenTo(this._queryRowsCollection.statusModel, 'change:status', this._setState);
  },

  _setState: function () {
    if (this._isErrored()) {
      this.set({ state: STATES.errored });
    } else if (this._isFetched()) {
      this.set({ state: STATES.fetched });
    } else {
      this.set({ state: STATES.fetching });
    }
  },

  _isErrored: function () {
    return this._querySchemaModel.hasRepeatedErrors() ||
      this._queryGeometryModel.hasRepeatedErrors() ||
      this._queryRowsCollection.hasRepeatedErrors();
  },

  _isFetching: function () {
    return this._querySchemaModel.isFetching() &&
      this._queryGeometryModel.isFetching() &&
      this._queryRowsCollection.isFetching();
  },

  _isFetched: function () {
    return this._querySchemaModel.isFetched() &&
      this._queryGeometryModel.isFetched() &&
      this._queryRowsCollection.isFetched();
  },

  isErrored: function () {
    return this.get('state') === STATES.errored;
  },

  isFetching: function () {
    return this.get('state') === STATES.fetching;
  },

  isFetched: function () {
    return this.get('state') === STATES.fetched;
  },

  isDone: function () {
    return this.isFetched() || this.isErrored();
  }
});

LayerContentModel.CONTEXTS = CONTEXTS;
LayerContentModel.STATES = STATES;

module.exports = LayerContentModel;
