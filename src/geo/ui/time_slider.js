cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  defaultTemplate: "<div><a href='#' class='playpause'>play</a></div>",
  className: 'cartodb-timeslider',

  events: {
    'click .playpause': 'toggleTime'
  },

  initialize: function() {
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'bottom|left';
    this.options.width = null;
    this.torqueLayer = this.options.layer;
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
  },

  toggleTime: function(e) {
    this.killEvent(e);
    this.torqueLayer.toggle();
  },

  enable: function() {}

});

