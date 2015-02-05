var cdb = require('cartodb.js');
var $ = require('jquery');
var BreadcrumbDropdown = require('./user_info/breadcrumb_dropdown_view');

/**
 * View to render the user info scetion
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
    this.undelegateEvents();

    var view = new BreadcrumbDropdown({
      target: $(ev.target),
      el: $('.js-breadcrumb-dropdown-content'),
      tick: 'center'
    });

    this.addView(view);

    view.on('onDropdownHidden', function() {
      view.clean();
      this.delegateEvents();
    }, this);

    view.open();
  }
});
