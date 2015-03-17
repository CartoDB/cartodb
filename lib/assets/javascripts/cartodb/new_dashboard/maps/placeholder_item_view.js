var cdb = require('cartodb.js');
var mapTemplates = require('../../new_common/map_templates');

/**
 * Represents a map card on dashboard.
 */
module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click .js-open': '_openCreateDialog'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_dashboard/maps/placeholder_item');
  },

  render: function() {
    this.clearSubViews();

    var example = mapTemplates[0];

    this.$el.html(
      this.template({
        desc: example.short_description,
        icon: example.icon
      })
    );

    return this;
  },

  _openCreateDialog: function() {
  }

});
