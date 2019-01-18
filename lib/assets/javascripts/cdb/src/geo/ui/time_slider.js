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
    _.bindAll(this, '_stop', '_start', '_slide', '_bindLayer', '_unbindLayer', 'updateSliderRange', 'updateSlider', 'updateTime', 'toggleTime', 'toggleButton');
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
    this.torqueLayer.on('play', this.toggleButton);
    this.torqueLayer.on('pause', this.toggleButton);
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
    if (changes.steps > 1){
      this.show();
      this.$(".slider" ).slider({ max: changes.steps - 1 });
    }
    else{
      this.hide();
    }
  },

  // each time time changes, move the slider
  updateTime: function(changes) {
    var self = this;
    var tb = self.torqueLayer.getTimeBounds();
    if (!tb) return;
    if (tb.columnType === 'date' || this.options.force_format_date) {
      if (tb && tb.start !== undefined) {
        var f = self.options.formatter || this.formatterForRange(tb.start, tb.end);
        // avoid showing invalid dates
        if (!_.isNaN(changes.time.getYear())) {
          self.$('.value').text(f(changes.time, this.torqueLayer));
        }
      }
    } else {
        self.$('.value').text(changes.step);
    }
  },

  formatter: function(_) {
    this.options.formatter = _;
  },

  formatterForRange: function(start, end) {
    start = start.getTime ? start : new Date(start);
    end = end.getTime ? end : new Date(end);
    var range = (end.getTime() - start.getTime()) / 1000;
    var ONE_DAY = 3600*24;
    var THREE_DAYS = ONE_DAY*3;
    var ONE_YEAR = ONE_DAY * 31 * 12;
    if(this.torqueLayer.options){
      var stepDurationMS = (end.getTime() - start.getTime()) / this.torqueLayer.options.steps;
    }

    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    function toUSDateStr(date) {
      return pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + "/" + pad(date.getFullYear());
    }

    function toTimeStr(date) {
      return pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    function toDateRange(date, torqueLayer) {
      var stepStartTimeMS = date.getTime();
      var tb = torqueLayer.getTimeBounds();
      var stepDurationMS = (new Date(tb.end).getTime() - new Date(tb.start).getTime()) / torqueLayer.options.steps;
      var stepEndTime = new Date(stepStartTimeMS + stepDurationMS);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return pad(months[date.getMonth()]) + " " + pad(date.getDate())  + " - " 
        + pad(months[stepEndTime.getMonth()]) + " " + pad(stepEndTime.getDate());
    }

    

    if (range < THREE_DAYS) {
      if (start.getDate() === end.getDate()) {
        return toTimeStr;
      } else {
        // range is less than a day, but the range spans more than one day so render the date in addition to the time
        return function(date) {
          return toUSDateStr(date) +' '+ toTimeStr(date);
        };
      }
    }

    if (range < ONE_YEAR) {
      if (stepDurationMS > ONE_DAY * 2000){ // More than 48 hours
        return toDateRange;
      }
      return toUSDateStr;
    }

    // >= ONE_YEAR
    return function(date) {
      return pad(date.getMonth() + 1) + "/" + pad(date.getFullYear());
    };
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
    if(torqueLayer.provider){
      this.updateSliderRange({"steps": torqueLayer.provider.getSteps()});
    }
  },

  toggleTime: function(e) {
    this.killEvent(e);
    this.torqueLayer.toggle();
  },
  toggleButton: function() {
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

