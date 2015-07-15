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

  initialize: function() {
    debugger;
  },

  render: function() {
    debugger;
    this.$el.html(
      cdb.templates.getTemplate('public_common/user_industries_template')()
    );

    return this;
  },

  _createDropdown: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('closeDialogs');

    var view = new IndustriesDropdown({
      target: $(ev.target),
      horizontal_offset: 18
    });
    view.render();

    view.on('onDropdownHidden', function() {
      view.clean();
    }, this);

    view.open();
  }

});
