cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  defaultTemplate: 
    "<div>" +
    "  <a href='#' class='playpause'>play</a>" +
    "  <span class='date'>10/20</span>" +
    "  <div class='slider'></div>" +
    "</div>" 
  ,
  className: 'cartodb-timeslider',

  events: {
    'click .playpause': 'toggleTime'
  },

  initialize: function() {
    _.bindAll(this, '_slide');
    var self = this;
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'bottom|left';
    this.options.width = null;
    this.torqueLayer = this.options.layer;

    // each time time changes, move the slider
    function updateTime(changes) {
      if (self.torqueLayer.options.start !== undefined) {
        var f = self.formaterForRange(self.torqueLayer.options.start, self.torqueLayer.options.end);
        self.$('.date').text(f(changes.time));
      }
    }

    function updateSlider(changes) {
      self.$(".slider" ).slider({ value: changes.step });
    }

    this.torqueLayer.on('change:time', updateSlider);
    this.torqueLayer.on('change:time', updateTime);

    this.on('clean', function() {
      self.torqueLayer.off('change:time', updateSlider);
      self.torqueLayer.off('change:time', updateTime);
    });
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
      
  },

  formaterForRange: function(start, end) {
    start = start.getTime ? start.getTime(): start;
    end = end.getTime ? end.getTime(): end;
    var span = (start - end)/1000;
    var ONE_DAY = 3600*24;
    function pad(n) { return n < 10 ? '0' + n : n; };
    // lest than a day
    if (span < ONE_DAY) return function(t) { return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes()); };
    return function(t) { return pad(t.getUTCMonth() + 1) + ":" + pad(t.getUTCFullYear()); };
  },

  _slide: function(e, ui) {
    var step = ui.value;
    this.torqueLayer.setStep(step);
  },
   
  _initSlider: function() {
    var torqueLayer = this.torqueLayer;
    var slider = this.$(".slider");
    slider.slider({
      min: 0,
      max: this.torqueLayer.options.steps,
      value: 0,
      step: 1,
      slide: this._slide
    });
  },

  toggleTime: function(e) {
    this.killEvent(e);
    this.torqueLayer.toggle();
  },

  enable: function() {},

  render: function() {
    cdb.geo.ui.InfoBox.prototype.render.apply(this, arguments);
    this._initSlider();
    return this;
  }

});

