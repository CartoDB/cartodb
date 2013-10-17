
  /**
   *  Time slider for CartoDB app
   *  - It stops event propagation in the whole component.
   */

  cdb.admin.TimeSlider = cdb.geo.ui.TimeSlider.extend({

    events: function(){
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