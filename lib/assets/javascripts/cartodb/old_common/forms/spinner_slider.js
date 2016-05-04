

  /**
   * Spinner slider (extends Dropdown)
   *
   * It shows the spinner slider.
   *
   * Usage example:
   *
      var spinner_slider = new cdb.admin.SpinnerSlider({
        target: $('a.account'),
        model: {},
        template_base: 'common/views/spinner_slider'
      });
   *
   */


  cdb.admin.SpinnerSlider = cdb.admin.DropdownMenu.extend({

    className: 'dropdown spinner_slider border',

    default_options: {
      width: 26,
      speedIn: 150,
      speedOut: 300,
      vertical_position: "up",
      horizontal_position: "right",
      horizontal_offset: 32,
      vertical_offset: 0,
      tick: "top"
    },

    events: {
      'click' : '_stopPropagation',
    },

    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    init: function(max,min,inc,value) {
      var self = this;

      this.$el.find("div.slider-ui").slider({
        orientation: "vertical",
        max: max,
        min: min,
        step: inc,
        value: value,
        slide: function(ev, ui) { self.trigger("valueChanged", ui.value, this.el); },
        change: function(ev, ui) { self.trigger("valueSet", ui.value, this.el); }
      });

      this.open();
    },

    hide: function(ev) {
      var self = this;
      this.isOpen = false;

      this.$el.animate({
        marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
        opacity: 0
      },this.options.speedOut, function(){
        // Remove selected class
        $(self.options.target).removeClass("selected");
        // And hide it
        self.$el.hide();
        var $slider = self.$el.find("div.slider-ui");
        if ($slider && $slider.data('ui-slider')) {
          $slider.slider("destroy");
        }
        self.remove();
      });
    }
  });
