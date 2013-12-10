
cdb.geo.ui.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  events: {
    'click .toggle': '_toggle'
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  initialize: function() {
    this.map = this.model;

    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');
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

      var slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.$el.find(".slider").append(slider.render().$el);
      this.$el.addClass("torque");

    }

    if (this.options.legends) {

      var stackedLegend = new cdb.geo.ui.StackedLegend({
        legends: this.options.legends
      });

      this.$el.find(".legends").append(stackedLegend.render().$el);
      this.$el.addClass("legends");

    }

    return this;
  }

});
