var Backbone = require('backbone');
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

    this._visDefinitionModel = opts.visDefinitionModel;
    this.state = window.dashboard.getState();
  }
});
