var cdb = require('cartodb.js-v3');

/**
 * The content of the dropdown menu opened by the link at the end of the breadcrumbs menu, e.g.
 *   username / Maps v
 *            ______/\____
 *           |            |
 *           |    this    |
 *           |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown',

  initialize: function() {
    this.elder('initialize');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);
  },

  render: function() {
    this.$el.show();

    return this;
  },

  clean: function() {
    this.$el.hide();
  }
});
