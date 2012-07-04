/**
 * INPUT PLACEHOLDER FOR THE MASSES
 *
 * Simulates a placeholder for a text input
 *
 * usage example:
 *
 *    var settings = new cdb.ui.common.Settings({
 *        el: "#settings_element",
 *        speed: 300
 *    });
 *    settings.show();
 *    // close it
 *    settings.close();
*/


cdb.admin.Placeholder = cdb.core.View.extend({

  tagName: 'div',
  className: 'field',

  events: {
    'click label': 'onLabelClick',
    'keyup input': 'onChange'
  },

  default_options: {
      speed: 300
  },

  initialize: function() {
    this.input = this.$el.find('input');

    // Render
    this.render();
    
    // Check
    this.check();
  },


  render: function() {
    var $el = this.$el;

    // Get label text
    var text = this.input.attr("data-label");

    if (!text) {
      return false;
    }

    // Prepend label
    $el.find("input").before("<label>" + text + "</label>");

    return this;
  },


  check: function() {
    if (this.input.val() != '') {
      this.$el.find('label').hide();
    }
  },


  onLabelClick: function() {
    this.input.focus();
  },


  onChange: function(ev) {
    var value = $(ev.target).val()
      , $label = this.$el.find('label');

    if (value.length>0) {
      $label.fadeOut(10);
    } else {
      $label.fadeIn(300);
    }
  }


});