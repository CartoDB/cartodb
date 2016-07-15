
  /**
   *  Color picker dropdown (extends Dropdown)
   *
   *  It shows the color options with a drop(up).
   *
   *  Usage example:
   *
   *  var color_picker = new cdb.admin.ColorPicker({
   *    target: $('a.account'),
   *    model: {},
   *    template_base: 'common/views/color_picker'
   *  });
   *
   */


  cdb.admin.ColorPicker = cdb.admin.DropdownMenu.extend({

    className: 'CDB-Text dropdown color_picker border',

    _PICKER_DELAY: 800,

    _COLORS: [
      // First file
      "#136400","#229A00","#B81609","#D6301D",
      "#F84F40","#41006D","#7B00B4","#A53ED5","#2E5387","#3E7BB6",
      "#5CA2D1","#FF6600","#FF9900","#FFCC00","#FFFFFF",
      // Second file
      "#012700","#055D00","#850200","#B40903","#F11810",
      "#11002F","#3B007F","#6B0FB2","#081B47","#0F3B82","#2167AB",
      "#FF2900","#FF5C00","#FFA300","#000000"
    ],

    default_options: {
      width: 197,
      speedIn: 150,
      speedOut: 300,
      vertical_position: "up",
      horizontal_position: "right",
      horizontal_offset: 5,
      vertical_offset: 0,
      tick: "right",
      dragUpdate: false,
      template_base: 'old_common/views/color_picker'
    },

    events: {
      'click a.advanced'          : '_openAdvanced',
      'click .default-colors li a': '_clickedColor',
      'keyup input.text'          : '_checkColor',
      'change input.text'         : '_checkColor',
      'submit form'               : '_submitColor',
      'click'                     : 'stopPropagation'
    },

    initialize: function() {
      cdb.admin.DropdownMenu.prototype.initialize.call(this);

      // Create a model with colors and "extra colors"
      this.model = new cdb.core.Model({
        visible:      false,
        colors:       this._COLORS,
        extra_colors: this.options.extra_colors,
        color:        ""
      });

      if (this.options.target)
        $(this.options.target).off("click", this._handleClick);

      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, "open", "hide", "_handleClick", "_keydown",
        '_openAdvanced', '_setPicker', '_setColor', '_onPickerMouseMove',
        '_onPickerMouseUp', '_submitColor');
      this.model.bind("change:colors change:extra_colors change:color", this.render, this);
    },

    render: function() {
      // Render element
      var d = this.model.toJSON();
      var self = this;

      if (d.extra_colors) {
        // Filter colors already present in default list
        d.extra_colors = _.filter(
          _.uniq( this.options.extra_colors ),
          function(c) {
            return  !_.contains( self._COLORS, c.toUpperCase() )
          }
        );
      }

      this.$el
        .html(this.template_base(d))
        .css({ width: this.options.width });

      // Init and render color picker
      ColorPicker.fixIndicators(
        this.$('.slider-indicator').get(0),
        this.$('.picker-indicator').get(0)
      );

      this.color_picker = ColorPicker(
        this.$('.slider').get(0),
        this.$('.picker').get(0),
        this._setPicker
      );

      return this;
    },

    stopPropagation: function(e) {
      e.stopPropagation();
    },

    _checkColor: function(e) {
      e.preventDefault();

      var color = new RGBColor(this.$("input.text").val());

      if (color.ok) {
        this.$("input.text").removeClass("error");
        this.$("form > span.color").css("background", color.toHex());
      } else {
        this.$("input.text").addClass("error");
      }
    },

    setColors: function(attr, value) {
      if (!attr || !value) {
        cdb.log.info('No attribute or value for color picker model');
        return false;
      }

      this.model.set(attr, value);
    },

    init: function(color) {
      color = color || '#FFFFFF';
      this.model.set('color', color);
      this._setColor(color);
      this.open();
    },

    _clickedColor: function(e) {
      e.preventDefault();
      var color = $(e.target).attr("href");
      this._triggerColor(color, true);
      this.hide();
    },

    _setPicker: function(hex, hsv, rgb, mousePicker, mouseSlide) {
      this._setColor(hex);
      ColorPicker.positionIndicators(
        this.$('.slider-indicator').get(0),
        this.$('.picker-indicator').get(0),
        mouseSlide, mousePicker
      );
    },

    _setColor: function(color) {
      this.$("form > span.color").css("background", color);
      this.$("input.text").val(color);
    },

    _submitColor: function(e) {
      if (e) e.preventDefault();
      var color = new RGBColor(this.$("input.text").val());

      if (color.ok) {
        this._triggerColor(color.toHex(), true);
        this.hide();
      }
    },

    _onPickerMouseMove: function() {
      if (this.options.dragUpdate) {
        var color = new RGBColor(this.$("input.text").val());
        if (color.ok) this._triggerColor(color.toHex(), false);
      }
    },

    _onPickerMouseUp: function() {
      var color = new RGBColor(this.$("input.text").val());
      if (color.ok) this._triggerColor(color.toHex(), false);
    },

    _bindAdvancedPicker: function() {
      this.$('.slider').bind('mousemove', this._onPickerMouseMove);
      this.$('.picker').bind('mousemove', this._onPickerMouseMove);
      this.$('.picker').bind('mouseup',   this._onPickerMouseUp);
      this.$('.slider').bind('mouseup',   this._onPickerMouseUp);
    },

    _destroyAdvancedPicker: function() {
      this.$('.slider').unbind('mousemove', this._onPickerMouseMove);
      this.$('.picker').unbind('mousemove', this._onPickerMouseMove);
      this.$('.picker').unbind('mouseup',   this._onPickerMouseUp);
      this.$('.slider').unbind('mouseup',   this._onPickerMouseUp);
    },

    _openAdvanced: function(e) {
      if (e) e.preventDefault();

      this._bindAdvancedPicker();

      this.$('div.top').addClass('advanced');
      this.positionate(e);
      // Set color in picker
      var color = new RGBColor(this.$("input.text").val());
      if (color.ok) this.color_picker.setHex(color.toHex())
    },

    _triggerColor: function(color, close) {
      // It triggers the color and if the parent
      // should close the picker or not.
      this.trigger('colorChosen', color, close, this.el);
    },

    positionate: function(e,target) {
      var $target = this.options.target;

      // Positionate
      var targetPos     = $target[this.options.position || 'offset']()
        , targetWidth   = $target.outerWidth()
        , targetHeight  = $target.outerHeight()
        , elementWidth  = this.$el.outerWidth()
        , elementHeight = this.$el.outerHeight();

      this.$el.css({
        top: targetPos.top + parseInt((this.options.vertical_position == "up") ? (- elementHeight - 10 - this.options.vertical_offset) : (targetHeight + 10 - this.options.vertical_offset)),
        left: targetPos.left + parseInt((this.options.horizontal_position == "left") ? (this.options.horizontal_offset - 15) : (targetWidth - elementWidth + 15 - this.options.horizontal_offset))
      }).addClass(
        // Add vertical and horizontal position class
        (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
        + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
        + " " +
        // Add tick class
        "tick_" + this.options.tick
      )
    },

    open: function(e,target) {
      // Target
      var $target = target && $(target) || this.options.target;

      this.positionate(e,target);

      // Show it
      this.show();

      // Dropdown openned
      this.model.set('visible', true);
    },

    hide: function(ev) {
      var self = this;

      this.$el.animate({
        marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
        opacity: 0
      },this.options.speedOut, function(){
        // Remove selected class
        $(self.options.target).removeClass("selected");
        // And clean it ;)
        self.clean();
      });

      // Dropdown hidden
      this.model.set('visible', false);
    },

    clean: function() {
      if (this.color_picker) {
        this.color_picker.unBind();
      }

      if (this.options.target)
        $(this.options.target).unbind("click", this._handleClick);

      cdb.admin.DropdownMenu.prototype.clean.call(this);
    }
  });
