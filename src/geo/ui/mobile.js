
cdb.geo.ui.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  events: {
    'click .toggle': '_toggle',
    "dragstart":      "_stopPropagation",
    "mousedown":      "_stopPropagation",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "_stopPropagation",
    "dblclick":       "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "click":          "_stopPropagation"
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  doOnOrientationChange: function() {

    switch(window.orientation)
    {
      case -90:
      case 90: this.recalc("landscape");
        break;
      default: this.recalc("portrait");
        break;
    }
  },

  recalc: function(orientation) {

    var height = $(".legends > div.cartodb-legend-stack").height();

    if (this.$el.hasClass("open") && height < 100 && !this.$el.hasClass("torque")) {
      this.$el.css("height", height);
      this.$el.find(".top-shadow").hide();
      this.$el.find(".bottom-shadow").hide();
    } else if (this.$el.hasClass("open") && height < 100 && this.$el.hasClass("legends") && this.$el.hasClass("torque")) {
      this.$el.css("height", height + $(".legends > div.torque").height() );
      this.$el.find(".top-shadow").hide();
      this.$el.find(".bottom-shadow").hide();
    }

  },

  initialize: function() {
    this.map = this.model;

    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');

    window.addEventListener('orientationchange', _.bind(this.doOnOrientationChange, this));

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    if (this.isOpen) this.close();
    else this.open();

  },

  open: function() {
    var self = this;

    this.$el.addClass("open");
    this.isOpen = true;
    this.$el.css("height", "110");

    this.recalc();
  },

  close: function() {

    var self = this;

    this.$el.removeClass("open");
    this.isOpen = false;

    this.$el.css("height", "40");

    this._fixTorque();

  },

  _fixTorque: function() {

    var self = this;

    setTimeout(function() {
      var w = self.$el.width() - self.$el.find(".toggle").width() - self.$el.find(".time").width();
      if (self.hasLegends) w -= 40;
      if (!self.hasLegends) w -= self.$el.find(".controls").width();
      self.$el.find(".slider-wrapper").css("width", w)
      self.$el.find(".slider-wrapper").show();

    }, 50);

  },

  render: function() {

    this.$el.html(this.template(this.options));
    var width = $(document).width() - 40;
    this.$el.css( { width: width })

    if (this.options.torqueLayer) {

      this.hasTorque = true;

      this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.slider.bind("time_clicked", function() {
        this.slider.toggleTime();
      }, this);

      this.$el.find(".torque").append(this.slider.render().$el);
      this.$el.addClass("torque");
      this.$el.find(".slider-wrapper").hide();

    }

    if (this.options.legends) {

      this.$el.find(".legends").append(this.options.legends.render().$el);

      var visible = _.some(this.options.legends._models, function(model) {
        return model.get("template") || (model.get("type") != 'none' && model.get("items").length > 0)
      });

      if (visible) {
        this.$el.addClass("legends");
        this.hasLegends = true;
        this.$el.find(".controls").hide();
      }

    }

    if (this.hasTorque && !this.hasLegends) {
      this.$el.find(".toggle").hide();
    }

    if (this.hasTorque) this._fixTorque();

    return this;
  }


});
