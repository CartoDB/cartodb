const $ = require('jquery');
const CoreView = require('backbone/core-view');
const BreadcrumbDropdown = require('./dropdown-view.js');

/**
 * View to render the user info section.
 * Expected to be created from existing DOM element.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-breadcrumb-dropdown-target': '_createBreadcrumbDropdown'
  },

  _previousDropDown: null,

  _createBreadcrumbDropdown: function (ev) {
    ev.preventDefault();

    if (this._previousDropDown) {
      this._previousDropDown.open();
      return;
    }

    var dropdown = new BreadcrumbDropdown({
      target: $(ev.target),
      el: $('.js-breadcrumb-dropdown-content'),
      horizontal_offset: 3, // to match the dropdown indicator/arrow
      horizontal_position: 'right',
      tick: 'right'
    });

    this._previousDropDown = dropdown;
    this.addView(dropdown);
    dropdown.on('onDropdownHidden', function () {
      dropdown.clean();
    }, this);

    dropdown.render();
    dropdown.open();
  },

  _closeAnyOtherOpenDialogs: function () {
    if (this._previousDropDown) {
      this._previousDropDown.hide();
    }
  }
});
