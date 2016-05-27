var cdb = require('cartodb.js');
var template = require('./basemap-header.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.$el.html(
      template({
        title: _t('editor.tab-pane.layers.basemap'),
        description: this.layerDefinitionModel.getName() + ' by CartoDB'
      })
    );
    return this;
  }

});
