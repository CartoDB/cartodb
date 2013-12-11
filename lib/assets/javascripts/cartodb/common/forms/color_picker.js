

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

    className: 'dropdown color_picker border',

    default_options: {
      width: 222,
      speedIn: 150,
      speedOut: 300,
      vertical_position: "up",
      horizontal_position: "right",
      horizontal_offset: 5,
      vertical_offset: 0,
      tick: "right",
      template_base: 'common/views/color_picker',
      extra_colors: [],
      colors: [
        "#333333","#0A460C","#136400","#229A00","#B81609","#D6301D","#F84F40","#41006D","#7B00B4","#A53ED5","#2E5387","#3E7BB6","#5CA2D1","#FF6600","#FF9900","#FFCC00","#FFFFFF",
        "#000000","#001301","#012700","#055D00","#850200","#B40903","#F11810","#11002F","#3B007F","#6B0FB2","#081B47","#0F3B82","#2167AB","#FF2900","#FF5C00","#FFA300","#CCCCCC"
      ]
    },

    events: {
      'click div.colors ul li a'  : '_clickedColor',
      'keyup input'               : '_checkColor',
      'change input'              : '_checkColor',
      'submit form'               : '_submitColor',
      'click'                     : '_stopPropagation',
      'click .image_picker a'     : '_pickImage'
    },

    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    _pickImage: function(e) {
      this.killEvent(e);
      var imagePicker = new cdb.admin.AssetManager({
        user: window.user_data, // TODO: assets manager should
                               // not rely on user data
        kind: this.options.kind
      });
      imagePicker.appendToBody().open();
      imagePicker.bind('fileChosen', function(url) {
        this.trigger("fileChosen", url, this.el);
        this.hide();
      }, this);
    },

    _checkColor: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      var color = new RGBColor(this.$el.find("input").val());

      if (color.ok) {
        this.$el.find("input").removeClass("error");
        this._setColor(color.toHex());
      } else {
        this.$el.find("input").addClass("error");
      }
    },

    _clickedColor: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      // Launch trigger
      this.trigger("colorChosen", $(ev.target).attr("href"), this.el);

      // Hide it
      this.hide();
    },

    setExtraColors: function(colors) {
      this.model.set("extra_colors", colors);
    },

    setColors: function(colors) {
      this.model.set("colors", colors);
    },

    setupModel: function() {

      if (this.model) this.model.unbind("change:colors", this);
      if (this.model) this.model.unbind("change:extra_colors", this);

      this.model = new cdb.core.Model({ colors: this.options.colors, extra_colors: this.options.extra_colors });
      this.model.bind("change:colors", this._updateColors, this);
      this.model.bind("change:extra_colors", this._updateExtraColors, this);
      this.add_related_model(this.model);

    },

    _updateExtraColors: function() {
      this.options.extra_colors = this.model.get("extra_colors");
      this.render();
    },

    _updateColors: function() {
      this.options.colors = this.model.get("colors");
      this.render();
    },

    init: function(color) {
      color = color || '#FFFFFF';
      this._setColor(color);
      this.$el.find("input").val(color);
      if(!this.options.imagePicker) {
        this.$el.find('.image_picker a').hide();
      }

      this.open();
    },

    _setColor: function(color) {
      this.$el.find("form > span.color").css("background", color)
    },

    _submitColor: function(ev) {
      ev.preventDefault();
      var color = new RGBColor(this.$el.find("input").val());
      if (color.ok) {
        this.trigger("colorChosen", color.toHex(), this.el);
        this.hide();
      } else {
        this.hide();
      }
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
        self.remove();
      });
    }
  });

