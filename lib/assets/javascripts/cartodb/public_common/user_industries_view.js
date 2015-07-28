var cdb = require('cartodb.js');
var IndustriesDropdown = require('./user_industries/dropdown_view');
var $ = require('jquery');

/**
 * View to render the user industries section in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-dropdown-target': '_createDropdown'
  },

  _createDropdown: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('closeDialogs');

    var view = new IndustriesDropdown({
      target: $(ev.target),
      vertical_offset: -10,
      horizontal_offset: $(ev.target).width()-120,
      horizontal_position: 'left',
      tick: 'center'
    });
    view.render();

    view.on('onDropdownHidden', function() {
      view.clean();
    }, this);

    view.open();
  }

});
