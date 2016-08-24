var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('./backbone/sync-abort');

/**
 * State definition model.
 * Used to persist the dashboard state at any time
 */
module.exports = Backbone.Model.extend({

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  url: function () {
    return this._visDefinitionModel.stateURL();
  },

  isNew: function () {
    return false;
  },

  initialize: function (attrs, opts) {
    if (!attrs.json) throw new Error('state json is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.dashboard) throw new Error('dashboard is required');

    this._visDefinitionModel = opts.visDefinitionModel;
    this._dashboard = opts.dashboard;

    this._initBinds();
  },

  toJSON: function () {
    return {
      json: this.get('json')
    };
  },

  _initBinds: function () {
    /*
     * TODO: Disabled widget states until issues are fixed.
     * See https://github.com/CartoDB/deep-insights.js/issues/416
     */
    // this._dashboard._dashboard.widgets._widgetsCollection.bind('change', _.debounce(this._updateState, 10), this);
    this._dashboard._dashboard.vis.map.bind('change', _.debounce(this._updateState, 250), this);
  },

  _updateState: function () {
    this.set('json', this._dashboard.getState());
    this.save();
  }
});
