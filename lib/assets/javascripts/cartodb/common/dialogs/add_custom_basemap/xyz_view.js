var cdb = require('cartodb.js');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/xyz')({
      })
    );

    return this;
  }
});
