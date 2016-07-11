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

  urlRoot: function () {
    return this._visDefinitionModel.stateURL();
  },

  initialize: function (attrs, opts) {
    if (!attrs.state) throw new Error('state is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.dashboard) throw new Error('dashboard is required');

    this._visDefinitionModel = opts.visDefinitionModel;
    this._dashboard = opts.dashboard;

    this.set('id', '');

    this._initBinds();
  },

  _initBinds: function () {
    this._dashboard._dashboard.widgets._widgetsCollection.bind('change', _.debounce(this._updateState, 10), this);
    this._dashboard._dashboard.vis.map.bind('change', _.debounce(this._updateState, 250), this);
  },

  _updateState: function () {
    this.set('state', this._dashboard.getState());
    this.save();
  }
});
