var cdb = require('cartodb.js');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/select_layer')({
        model: this.model,
        layersFetched: this.model.layersFetched(),
        layersAvailable: this.model.layersAvailable()
      })
    );

    return this;
  }

});
