var Backbone = require('backbone');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var STATES = require('./query-base-status');

var CONTEXTS = {
  map: 'map',
  table: 'table'
};

var REQUIRED_OPTS = [
  'querySchemaModel',
  'queryGeometryModel',
  'queryRowsCollection'
];

var LayerContentModel = Backbone.Model.extend({
  defaults: {
    context: CONTEXTS.map, // map or table
    // This variable `state` is only used for the trigger change:state event.
    // It lives in the model so, as long as the model is recreated with the view every time,
    // this variable is not shared between views and can NOT use it to get the real state.
    state: STATES.initial
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
    this.set('state', this._getState());
  },

  _getState: function () {
    if (this.isErrored()) return STATES.errored;
    if (this.isFetched()) return STATES.fetched;
    if (this.isFetching()) return STATES.fetching;
    if (this.isInitial()) return STATES.initial;

    return STATES.unavailable;
  },

  isErrored: function () {
    return this._querySchemaModel.hasRepeatedErrors() ||
      this._queryGeometryModel.hasRepeatedErrors() ||
      this._queryRowsCollection.hasRepeatedErrors();
  },

  isFetching: function () {
    return this._querySchemaModel.isFetching() ||
      this._queryGeometryModel.isFetching() ||
      this._queryRowsCollection.isFetching();
  },

  isFetched: function () {
    return this._querySchemaModel.isFetched() &&
      this._queryGeometryModel.isFetched() &&
      this._queryRowsCollection.isFetched();
  },

  isInFinalStatus: function () {
    return this._querySchemaModel.isInFinalStatus() &&
      this._queryGeometryModel.isInFinalStatus() &&
      this._queryRowsCollection.isInFinalStatus();
  },

  isInitial: function () {
    return this.get('state') === STATES.initial;
  },

  isDone: function () {
    return this.isFetched() || this.isErrored();
  }
});

LayerContentModel.CONTEXTS = CONTEXTS;
LayerContentModel.STATES = STATES;

module.exports = LayerContentModel;
