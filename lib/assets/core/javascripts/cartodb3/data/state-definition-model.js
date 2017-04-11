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

  url: function () {
    return this._visDefinitionModel.stateURL();
  },

  isNew: function () {
    return false;
  },

  initialize: function (attrs, opts) {
    if (!attrs.json) throw new Error('state json is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

    this._visDefinitionModel = opts.visDefinitionModel;
  },

  toJSON: function () {
    return {
      json: this.get('json')
    };
  },

  updateState: function (state) {
    this.save({
      json: state
    });
  },

  setBounds: function (bounds) {
    this.trigger('boundsSet', bounds);
  },

  getZoom: function () {
    return this.get('json').map.zoom;
  },

  getCenter: function () {
    return this.get('json').map.center;
  }
});
