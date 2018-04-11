const $ = require('jquery');
const DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');
const template = require('./dropdown.tpl');

/**
 * The content of the dropdown menu opened by the user in the data-library filters, e.g.:
 *   Category ▼
 *      ______/\____
 *     |            |
 *     |    this    |
 *     |____________|
 */
module.exports = DropdownAdminView.extend({
  className: 'CDB-Text Dropdown Dropdown--public',

  events: {
    'click .js-all': '_onClickAll',
    'click .js-categoryLink': '_onClickLink'
  },

  render: function () {
    this.$el.html(template());

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  _onClickAll: function (event) {
    this.collection.options.set({
      tags: '',
      page: 1
    });

    this.hide();
  },

  _onClickLink: function (event) {
    var tag = $(event.target).text();

    this.collection.options.set({
      tags: tag,
      page: 1
    });

    this.hide();
  }
});
