

  /**
   *  Pattern picker dropdown (extends Dropdown)
   *
   *  It shows the color and the image pattern options
   *  with a drop(up)down.
   *
   *  Usage example:
   *
   *  var pattern_picker = new cdb.admin.PatternPicker({
   *    target:         $('a.pattern'),
   *    model:          new cdb.Core.Model(),
   *    template_base:  'common/views/pattern_picker'
   *  });
   *
   *  It could have two different types:
   *    - color (by default).
   *    - asset.
   *
   *  Event when color or pattern is chosen.
   *  view.trigger('patternChosen', :type, :value, :el);
   *
   */


  cdb.admin.PatternPicker = cdb.admin.DropdownMenu.extend({

    className: 'dropdown pattern_picker border',

    default_options: {
      width: 222,
      speedIn: 150,
      speedOut: 300,
      vertical_position: "up",
      horizontal_position: "right",
      horizontal_offset: 5,
      vertical_offset: 0,
      tick: "right",
      colors: [
        "#333333","#0A460C","#136400","#229A00","#B81609","#D6301D","#F84F40",
        "#41006D","#7B00B4","#A53ED5","#2E5387","#3E7BB6","#5CA2D1","#FF6600",
        "#FF9900","#FFCC00","#FFFFFF","#000000","#001301","#012700","#055D00",
        "#850200","#B40903","#F11810","#11002F","#3B007F","#6B0FB2","#081B47",
        "#0F3B82","#2167AB","#FF2900","#FF5C00","#FFA300","#CCCCCC"
      ],
      asset_pattern: true
    },

    events: {
      'click div.colors ul li a': '_clickedColor',
      'click a.asset_pattern'   : '_chooseAsset',
      'keyup input'             : '_checkColor',
      'change input'            : '_checkColor',
      'submit form'             : '_submitPattern',
      'click'                   : '_stopPropagation'
    },

    initialize: function() {
      _.bindAll(this, "open", "hide", "_clickedColor", "_checkColor", "_keydown");
      this.type = 'color';
      cdb.admin.DropdownMenu.prototype.initialize.call(this);
    },

    /* Open and init dropdown setting the value */
    init: function(value) {
      var bkg = value;
      this.type = this._getType(value);
      this._setPattern(value);
      this.open();
    },

    /* get type of pattern (color?, asset?)*/
    _getType: function(value) {
      var color = new RGBColor(value);
      if (color.ok) {
        return 'color';
      }
      return 'asset'
    },

    _checkColor: function(ev) {
      this.killEvent(ev);

      var color = new RGBColor(this.$("input").val());

      if (color.ok) {
        this.$("input").removeClass("error");
        this._setColor(color.toHex());
      } else {
        this.$("input").addClass("error");
      }
    },

    _clickedColor: function(ev) {
      this.killEvent(ev);

      // Launch trigger
      this.type = 'color';
      this.trigger("patternChosen", this.type, $(ev.target).attr("href"), this.el);

      // Hide it
      this.hide();
    },

    _setPattern: function(value) {
      var $input = this.$("input");
      var $span = this.$("form > span.pattern");

      if (this.type === "color") {
        $input.val(value);
        $span.css("background", value);
      } else {
        $input.val(this._getFileName(value));
        $span.css("background", "url('" + value + "') repeat 0 0");
      }

      this
        .removeClass('asset color')
        .addClass(this.type);
    },

    _getFileName: function(value) {
      var url_splitted = value.split('/');
      return url_splitted[url_splitted.length - 1];
    },

    _submitPattern: function(ev) {
      ev.preventDefault();
      var value = '';

      if (this.type === "color") {
        value = new RGBColor(this.$("input").val());
        this.hide();
      } else {

        this.hide();
      }

      this.trigger("patternChosen", this.type, value, this.el);
    },

    /* Hide color picker */

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

