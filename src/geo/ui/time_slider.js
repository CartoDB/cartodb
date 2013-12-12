cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  className: 'cartodb-timeslider',

  defaultTemplate:
    " <ul> " +
    "   <li class='controls'><a href='#/stop' class='button stop'>pause</a></li>" +
    "   <li class='time'><p class='value'></p></li>" +
    "   <li class='last'><div class='slider-wrapper'><div class='slider'></div></div></li>" +
    " </ul> "
  ,

  events: {
    "click .button":  "toggleTime",
    "click .time":    "_onClickTime",
    "dragstart":      "_stopPropagation",
    "mousedown":      "_stopPropagation",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "_stopPropagation",
    "dblclick":       "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "click":          "_stopPropagation"
  },

  initialize: function() {
    _.bindAll(this, '_stop', '_start', '_slide', '_bindLayer', '_unbindLayer', 'updateSliderRange', 'updateSlider', 'updateTime');
    var self = this;
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'bottom|left';
    this.options.width = null;

    // Control variable to know if the layer was
    // running before touching the slider
    this.wasRunning = false;

    this._bindLayer(this.options.layer);
    this.on('clean', this._unbindLayer);
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);

  },

  setLayer: function(layer) {
    this._unbindLayer();
    this._bindLayer(layer);
    this._initSlider();
  },

  _bindLayer: function(layer) {
    this.torqueLayer = layer;
    this.torqueLayer.on('change:time', this.updateSlider);
    this.torqueLayer.on('change:time', this.updateTime);
    this.torqueLayer.on('change:steps', this.updateSliderRange);
    return this;
  },

  _unbindLayer: function() {
    this.torqueLayer.off('change:time', this.updateSlider);
    this.torqueLayer.off('change:time', this.updateTime);
    this.torqueLayer.off('change:steps', this.updateSliderRange);
    return this;
  },

  updateSlider: function(changes) {
    this.$(".slider" ).slider({ value: changes.step });
  },

  updateSliderRange: function(changes) {
    this.$(".slider" ).slider({ max: changes.steps });
  },

  // each time time changes, move the slider
  updateTime: function(changes) {
    var self = this;
    var tb = self.torqueLayer.getTimeBounds();
    if (!tb) return;
    if (tb.columnType === 'date' || this.options.force_format_date) {
      if (tb && tb.start !== undefined) {
        var f = self.options.formatter || self.formaterForRange(tb.start, tb.end);
        // avoid showing invalid dates
        if (!_.isNaN(changes.time.getYear())) {
          self.$('.value').text(f(changes.time));
        }
      }
    } else {
        self.$('.value').text(changes.step);
    }
  },

  formatter: function(_) {
    this.options.formatter = _;
  },

  formaterForRange: function(start, end) {
    start = start.getTime ? start.getTime(): start;
    end = end.getTime ? end.getTime(): end;
    var span = (end - start)/1000;
    var ONE_DAY = 3600*24;
    var ONE_YEAR = ONE_DAY * 31 * 12;
    function pad(n) { return n < 10 ? '0' + n : n; };
    // lest than a day
    if (span < ONE_DAY)   return function(t) { return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes()); };
    if (span < ONE_YEAR) return function(t) { return pad(t.getUTCMonth() + 1) + "/" + pad(t.getUTCDate()) + "/" + pad(t.getUTCFullYear()); };
    return function(t) { return pad(t.getUTCMonth() + 1) + "/" + pad(t.getUTCFullYear()); };
  },

  _slide: function(e, ui) {
    this.killEvent(e);
    var step = ui.value;
    this.torqueLayer.setStep(step);
  },

  _start: function(e, ui) {
    if(this.torqueLayer.isRunning()) {
      this.wasRunning = true;
      this.toggleTime();
    }
  },

  _stop: function(e, ui) {
    if (this.wasRunning) {
      this.toggleTime()
    }

    this.wasRunning = false;
  },

  _initSlider: function() {
    var torqueLayer = this.torqueLayer;
    var slider = this.$(".slider");
    slider.slider({
      range: 'min',
      min: 0,
      max: this.torqueLayer.options.steps,
      value: 0,
      step: 1, //
      value: this.torqueLayer.getStep(),
      stop: this._stop,
      start: this._start,
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

   _onClickTime: function() {
    this.trigger("time_clicked", this);
  },

  render: function() {
    cdb.geo.ui.InfoBox.prototype.render.apply(this, arguments);
    this._initSlider();
    return this;
  }

});

