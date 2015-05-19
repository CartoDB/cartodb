var cdb = require('cartodb.js');

/**
 * Represents the WMS/WMTS tab category.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms')({
      })
    );

    return this;
  }

});
