var DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');

/**
 * The content of the dropdown menu opened by the link at the end of the breadcrumbs menu, e.g.
 *   username / Maps v
 *            ______/\____
 *           |            |
 *           |    this    |
 *           |____________|
 */
module.exports = DropdownAdminView.extend({
  className: 'Dropdown',

  hide: function () {
    this.$el.css({
      opacity: 0
    });
  }
});
