var cdb = require('cartodb.js');
var template = require('./layer-header.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.layerTableModel = this.layerDefinitionModel.layerTableModel;
  },

  render: function () {
    this.$el.html(
      template({
        title: this.layerTableModel.get('table_name'),
        alias: this.layerTableModel.get('alias') || this.layerTableModel.get('table_name').replace(/_/gi, ' ')
      })
    );
    return this;
  }
});
