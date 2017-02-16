var _ = require('underscore');
var $ = require('jquery');

var MutationObserver = window.MutationObserver;

var MARGINS = {
  top: 8,
  bottom: 8
};

var initObserver = function (popup, onChangeMutation) {
  var config = {
    childList: true,
    subtree: true
  };

  var observer = new MutationObserver(onChangeMutation);
  observer.observe(popup.get ? popup.get(0) : popup, config);
  return observer;
};

var initScroll = function (reference) {
  return reference.closest('.js-perfect-scroll');
};

var Manager = function (id, reference, popup) {
  this.id = id;
  this.reference = reference;
  this.popup = popup;

  // to capture click events and avoid close the dialog
  popup.attr('data-cid', id);
  popup.attr('data-dialog', id);
};

Manager.prototype = {
  append: function (mode) {
    this.mode = mode;
    var popup = this.popup.get(0);
    var ref = this.reference.get(0);
    if (mode === 'float') {
      document.body.appendChild(popup);
    } else {
      ref.appendChild(popup);
    }
  },

  track: function () {
    if (this.mode !== 'float') {
      return;
    }

    // we need to watch when the dialog's height changes in order to reposition it again
    this.observer = initObserver(this.popup, this.onChangeMutation.bind(this));
    this.emitter = initScroll(this.reference);
    this.repositionBinded = _.throttle(this.reposition.bind(this), 15);

    if (this.emitter) {
      this.emitter
        .on('ps-scroll-x', this.repositionBinded)
        .on('ps-scroll-y', this.repositionBinded);
    }

    this.reposition();
  },

  onChangeMutation: function (mutations) {
    _.each(mutations, function (mutation) {
      var target = $(mutation.target);
      var id = target.attr('data-cid');

      if (!id) {
        id = target.closest('[data-cid]').attr('data-cid');
      }

      if (id === this.id) {
        this.reposition();
      }
    }, this);
  },

  reposition: function () {
    if (this.mode !== 'float') {
      return;
    }

    var dh = $('body').height();
    var ref = this.reference;
    var popup = this.popup;

    var refPosition = ref.offset();

    var onBottom = refPosition.top + ref.height() + MARGINS.top;
    var onTop = refPosition.top - popup.height() - MARGINS.bottom;
    var ph = popup.height();
    var top = (onBottom + ph + MARGINS.bottom >= dh) ? onTop : onBottom;

    // Boundries come from document height to avoid scroll
    if (top < 0) {
      top = MARGINS.top;
    } else {
      top = Math.min(top, dh - ph - MARGINS.bottom);
    }

    popup.css({
      top: top,
      left: refPosition.left
    });
  },

  untrack: function () {
    this.observer && this.observer.disconnect();
    if (this.emitter) {
      this.emitter
        .off('ps-scroll-x', this.repositionBinded)
        .off('ps-scroll-y', this.repositionBinded);
    }
  },

  destroy: function () {
    this.untrack();

    var el = document.querySelector('[data-dialog=' + this.id + ']');
    if (el && document.body.contains(el)) {
      document.body.removeChild(el);
    }

    this.emitter = null;
    this.reference = null;
    this.popup = null;
  }
};

module.exports = Manager;
