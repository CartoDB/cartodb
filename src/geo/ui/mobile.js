
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

    function recalc() {

      var width = $(document).width();
      $(".cartodb-mobile.open").css("width", width - 40)

      var w = $(".cartodb-mobile.open").width() - $(".cartodb-mobile.open .toggle").width() - $(".cartodb-mobile.open .time").width();
      $("div.cartodb-timeslider .slider-wrapper").css("width", w - 10)

    }

    switch(window.orientation)
    {
      case -90:
      case 90: recalc();
        break;
      default: recalc();
        break;
    }
  },

  initialize: function() {
    this.map = this.model;

    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');

    window.addEventListener('orientationchange', this.doOnOrientationChange);

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

    var width = $(document).width();
    $(".cartodb-mobile.open").css("width", width - 40)

    var w = $(".cartodb-mobile.open").width() - $(".cartodb-mobile.open .toggle").width() - $(".cartodb-mobile.open .time").width();
    $("div.cartodb-timeslider .slider-wrapper").css("width", w - 10)

  },

  close: function() {

    var self = this;

    this.$el.removeClass("open");
    this.isOpen = false;

  },

  render: function() {
    this.$el.html(this.template(this.options));
    var width = $(document).width() - 40;
    this.$el.css( { width: width })

    if (this.options.torqueLayer) {

      this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.slider.bind("time_clicked", function() {
        this.slider.toggleTime();
      }, this);

      this.$el.find(".torque").append(this.slider.render().$el);
      this.$el.addClass("torque");

    }

    if (this.options.legends) {

      this.$el.find(".legends").append(this.options.legends.render().$el);

      var visible = _.some(this.options.legends._models, function(model) {
        return model.get("template") || (model.get("type") != 'none' && model.get("items").length > 0)
      });

      if (visible) this.$el.addClass("legends");

    }

    return this;
  },

  test: function() {
    console.log('a');
  }


});
