var $ = require('jquery');
var CoreView = require('backbone/core-view');
var IndustriesDropdown = require('./user-industries/dropdown-view');

/**
 * View to render the user settings section in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = CoreView.extend({
  events: {
    'click .js-dropdown-target': '_createDropdown'
  },

  _createDropdown: function (event) {
    if (event) {
      event.preventDefault();
    }

    var $target = $(event.target);

    var view = new IndustriesDropdown({
      target: $target,
      verticalOffset: -10,
      horizontalOffset: $target.width() - 100,
      horizontalPosition: 'left',
      tick: 'center'
    });

    view.render();

    view.on('onDropdownHidden', function () {
      view.clean();
    }, this);

    view.open();
  }
});
