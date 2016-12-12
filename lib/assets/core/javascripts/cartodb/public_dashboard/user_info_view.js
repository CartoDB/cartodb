var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var BreadcrumbDropdown = require('./user_info/breadcrumb_dropdown_view');

/**
 * View to render the user info section.
 * Expected to be created from existing DOM element.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-breadcrumb-dropdown-target': '_createBreadcrumbDropdown'
  },

  render: function() {
    return this;
  },

  _createBreadcrumbDropdown: function(ev) {
    this.killEvent(ev);
    var dropdown = new BreadcrumbDropdown({
      target: $('.js-breadcrumb-dropdown-target'),
      el: $('.js-breadcrumb-dropdown-content'),
      horizontal_offset: 3, // to match the dropdown indicator/arrow
      horizontal_position: 'right',
      tick: 'right'
    });
    this.addView(dropdown);
    dropdown.on('onDropdownShown', function () {
      cdb.god.trigger('closeDialogs');
    }, this);
    dropdown.open();
  }
});
