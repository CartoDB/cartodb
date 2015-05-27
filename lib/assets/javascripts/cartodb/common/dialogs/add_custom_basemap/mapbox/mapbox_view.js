var cdb = require('cartodb.js');

/**
 * Represents the Mapbox tab content.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/mapbox/mapbox')({
      })
    );

    return this;
  }
});
