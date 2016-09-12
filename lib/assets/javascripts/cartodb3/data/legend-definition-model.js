var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');

/*
  Base model for a legend. It should have a reference to a layerDefinitionModel.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: '',
    items: [],
    prefix: '',
    suffix: '',
    rawHtml: '',
    preHtml: '',
    postHtml: '',
    fill: '#fabada'
  },

  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
  },

  getStyles: function () {
    return this.layerDefinitionModel.styleModel;
  },

  fetch: function () {
    throw new Error('This model should not make any fetch calls. It should be created from the vizJSON.');
  }
});
