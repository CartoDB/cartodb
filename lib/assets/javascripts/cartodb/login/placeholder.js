/**
 * INPUT PLACEHOLDER FOR THE MASSES
 *
 * Simulates a placeholder for a text input
 *
 * usage example:
 *
 *    var placeholder = new cdb.admin.Placeholder({
 *        el: "div.field",
 *        speedIn: 300,
          speedOut: 10
 *    });
 *
 *    // Disable the placeholder label
 *    placeholder.disable();
 *    
 *    
*/


cdb.admin.Placeholder = cdb.core.View.extend({

  tagName: 'div',
  className: 'field',

  events: {
    'click label': '_onLabelClick',
    'keyup input': '_onChange'
  },

  default_options: {
      speedOut: 10,
      speedIn: 300
  },

  initialize: function() {
    // Set options
    _.defaults(this.options, this.default_options);

    // Input element
    this.$input = this.$el.find('input');

    // Render
    this.render();
    
    // Check
    setTimeout(this._check,500);
  },


  render: function() {
    _.bindAll(this,"_check");

    // Get label text
    var text = this.$input.attr("data-label")
      , height = this.$input.outerHeight();

    // If this field doesn't have data-label, that means it 
    // doesn't need a placeholder :)
    if (!text) {
      return false;
    }

    // Create the placeholder label
    this.$label = $("<label class='placeholder' style='line-height:" + height + "px'>").text(text);

    // Prepend label
    this.$input.before(this.$label);

    return this;
  },


  disable: function() {
    // Unbind keyup
    this.$input.unbind("keyup");
    // Remove Label
    this.$label
      .hide()
      .unbind("click")
      .remove()
  },


  _check: function() {
    // If the input has a previous value don't show the "placeholder"
    if (this.$input.val() != '' && this.$label) {
      this.$label.hide();
    }
  },


  _onLabelClick: function() {
    // If clicks in the label, focus in the input
    this.$input.focus();
  },


  _onChange: function(ev) {
    // Check input every time the user types to show or not the "placeholder"
    var value = $(ev.target).val()
      , options = this.options;

    if (value.length>0) {
      this.$label.fadeOut(this.options.speedOut);
    } else {
      this.$label.fadeIn(this.options.speedIn);
    }
  }
});