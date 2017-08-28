var cdb = require('cartodb.js-v3');
var CreateDialog = require('../../common/dialogs/create/create_view');

/**
 * Represents a map card on dashboard.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  render: function() {
    this.clearSubViews();

    this.template = cdb.templates.getTemplate('dashboard/maps/placeholder_item');

    this.$el.html(
      this.template({
        desc: this.model.get('short_description'),
        url: this.model.get('guide_url'),
        icon: this.model.get('icon')
      })
    );

    return this;
  }
});
