var cdb = require('cartodb.js');

/**
 * Sub view, to enter WMS/WMTS kind-of URL.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/enter_url')({
        layersFetched: this.model.layersFetched()
      })
    );

    return this;
  }

});
