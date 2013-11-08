cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  className: 'cartodb-timeslider',

  defaultTemplate:
    " <ul> " +
    "   <li><a href='#/stop' class='button stop'>pause</a></li>" +
    "   <li><p class='value'>10/20</p></li>" +
    "   <li class='last'><div class='slider-wrapper'><div class='slider'></div></div></li>" +
    " </ul> "
  ,

  events: {
    "click .button":  "toggleTime",
    "dragstart":      "killEvent",
    "mousedown":      "killEvent",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "killEvent",
    "dblclick":       "killEvent",
    "mousewheel":     "killEvent",
    "DOMMouseScroll": "killEvent",
    "click":          "killEvent"
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
      var tb = self.torqueLayer.getTimeBounds();
      if (tb && tb.start !== undefined) {
        var f = self.formaterForRange(tb.start, tb.end);
        self.$('.value').text(f(changes.time));
      }
    }

    function updateSlider(changes) {
      self.$(".slider" ).slider({ value: changes.step });
    }

    function updateSliderRange(changes) {
      self.$(".slider" ).slider({ max: changes.steps });
    }

    this.torqueLayer.on('change:time', updateSlider);
    this.torqueLayer.on('change:time', updateTime);
    this.torqueLayer.on('change:steps', updateSliderRange);

    this.on('clean', function() {
      self.torqueLayer.off('change:time', updateSlider);
      self.torqueLayer.off('change:time', updateTime);
      self.torqueLayer.off('change:steps', updateSliderRange);
    });
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);

  },

  formaterForRange: function(start, end) {
    start = start.getTime ? start.getTime(): start;
    end = end.getTime ? end.getTime(): end;
    var span = (end - start)/1000;
    var ONE_DAY = 3600*24;
    function pad(n) { return n < 10 ? '0' + n : n; };
    // lest than a day
    if (span < ONE_DAY) return function(t) { return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes()); };
    return function(t) { return pad(t.getUTCMonth() + 1) + "/" + pad(t.getUTCFullYear()); };
  },

  _slide: function(e, ui) {
    this.killEvent(e);
    var step = ui.value;
    this.torqueLayer.setStep(step);
  },

  _initSlider: function() {
    var torqueLayer = this.torqueLayer;
    var slider = this.$(".slider");
    slider.slider({
      range: 'min',
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
    this.$('.button')
      [(this.torqueLayer.isRunning() ? 'addClass': 'removeClass')]('stop')
      .attr('href','#/' + (this.torqueLayer.isRunning() ? 'pause': 'play'))
      .html(this.torqueLayer.isRunning() ? 'pause': 'play');
  },

  enable: function() {},

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  render: function() {
    cdb.geo.ui.InfoBox.prototype.render.apply(this, arguments);
    this._initSlider();
    return this;
  }

});

