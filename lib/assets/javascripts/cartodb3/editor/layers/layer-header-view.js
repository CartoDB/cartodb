var cdb = require('cartodb.js');
var template = require('./layer-header.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.$el.html(
      template({
        title: this.layerDefinitionModel.getName(),
        alias: this.layerDefinitionModel.getTableName().replace(/_/gi, ' ')
      })
    );
    return this;
  }
});
