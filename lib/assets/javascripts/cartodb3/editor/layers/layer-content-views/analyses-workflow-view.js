var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.View.extend({

  events: {},

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitonsCollection) throw new Error('analysisDefinitonsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitonsCollection = opts.analysisDefinitonsCollection;
    this.viewModel = opts.viewModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.append('workflow');
    return this;
  }
});
