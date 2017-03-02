var cdb = require('cartodb.js-v3');

/**
 * Represents a map card on dashboard.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click .first-map-button': '_createFirstMap'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('dashboard/maps/placeholder_item_first_map');
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      this.template({})
    );

    return this;
  },

  _createFirstMap: function () {
    $('.js-new_map').click();
  }

});
