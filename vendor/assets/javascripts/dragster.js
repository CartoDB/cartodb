
(function() {
  var Dragster,
      __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Dragster = (function() {
    function Dragster(el) {
      this.el = el;
      this.dragleave = __bind(this.dragleave, this);
      this.dragenter = __bind(this.dragenter, this);
      this.first = false;
      this.second = false;
      this.el.addEventListener("dragenter", this.dragenter, false);
      this.el.addEventListener("dragleave", this.dragleave, false);
    }

    Dragster.prototype.dragenter = function(event) {
      if (this.first) {
        return this.second = true;
      } else {
        this.first = true;
        this.customEvent = document.createEvent("CustomEvent");
        this.customEvent.initCustomEvent("dragster:enter", true, true, {
          dataTransfer: event.dataTransfer,
          sourceEvent: event
        });
        return this.el.dispatchEvent(this.customEvent);
      }
    };

    Dragster.prototype.dragleave = function(event) {
      if (this.second) {
        this.second = false;
      } else if (this.first) {
        this.first = false;
      }
      if (!this.first && !this.second) {
        this.customEvent = document.createEvent("CustomEvent");
        this.customEvent.initCustomEvent("dragster:leave", true, true, {
          dataTransfer: event.dataTransfer,
          sourceEvent: event
        });
        return this.el.dispatchEvent(this.customEvent);
      }
    };

    Dragster.prototype.removeListeners = function() {
      this.el.removeEventListener("dragenter", this.dragenter, false);
      return this.el.removeEventListener("dragleave", this.dragleave, false);
    };

    Dragster.prototype.reset = function() {
      this.first = false;
      return this.second = false;
    };

    return Dragster;

  })();

  window.Dragster = Dragster;

}).call(this);
