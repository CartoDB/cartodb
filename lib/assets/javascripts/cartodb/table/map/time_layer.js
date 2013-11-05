
  /**
   *
   */

  cdb.admin.TimeSlider = cdb.geo.ui.TimeSlider.extend({

    // extend this events here in order to avoid the
    // events are bubbled up to the map
    events: function() {
      return _.extend({},cdb.geo.ui.TimeSlider.prototype.events,{
        "dragstart":      "killEvent",
        "mousedown":      "killEvent",
        "touchstart":     "killEvent",
        "MSPointerDown":  "killEvent",
        "dblclick":       "killEvent",
        "mousewheel":     "killEvent",
        "DOMMouseScroll": "killEvent",
        "click":          "killEvent"
      });
    }

  })
