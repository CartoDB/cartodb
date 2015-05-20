var cdb = require('cartodb.js');

/**
 * View for an individual layer item.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'List-row',

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/layer')({
        model: this.model
      })
    );
    return this;
  }

});
