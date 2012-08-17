

  /**
   * Color picker dropdown (extends Dropdown)
   *
   * It shows the color options with a drop(up).
   *
   * Usage example:
   *
      var color_picker = new cdb.admin.ColorPicker({
        target: $('a.account'),
        model: {},
        template_base: 'common/views/color_picker'
      });
   *
   */


  cdb.admin.ColorPicker = cdb.admin.DropdownMenu.extend({

    className: 'dropdown color_picker',

    default_options: {
      width: 196,
      speedIn: 150,
      speedOut: 300,
      vertical_position: "up",
      horizontal_position: "right",
      horizontal_offset: 5,
      tick: "right",
      colors: [
        "#0A460C","#136400","#229A00","#B81609","#D6301D","#F84F40","#41006D","#7B00B4","#A53ED5","#2E5387","#3E7BB6","#5CA2D1","#FF6600","#FF9900","#FFCC00",
        "#001301","#012700","#055D00","#850200","#B40903","#F11810","#11002F","#3B007F","#6B0FB2","#081B47","#0F3B82","#2167AB","#FF2900","#FF5C00","#FFA300"
      ]
    },

    events: {
      'click div.colors ul li a' : '_colorChosen'
    },

    _colorChosen: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      
      // Launch trigger
      var color = $(ev.target).attr("href");
      this.trigger("colorChosen", color, this.el);

      // Hide it
      this.hide();
    }
  });
