var $ = require('jquery');
var DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');
var template = require('./dropdown.tpl');

/**
 * The content of the dropdown menu opened by the industries link in the header, e.g.:
 *   CartoDB, Industries, Explore, Pricing
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */
module.exports = DropdownAdminView.extend({
  className: 'CDB-Text Dropdown Dropdown--public',

  render: function () {
    this.$el.html(template());

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  }
});
