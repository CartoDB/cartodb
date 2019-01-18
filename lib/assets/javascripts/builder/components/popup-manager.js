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

  if (!MutationObserver) {
    return;
  }

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
  this.state = {
    position: 'bottom',
    scroll: 0
  };

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
        this.repositionBinded();
      }
    }, this);
  },

  reposition: function () {
    if (this.mode !== 'float' || !this.emitter) {
      return;
    }

    var scroll = this.emitter.get(0).scrollTop;

    var dh = $(window).height();
    var ref = this.reference;
    var popup = this.popup;
    var state = this.state;

    var refPosition = ref.offset();
    var ph = popup.outerHeight();

    var onBottom = refPosition.top + ref.outerHeight() + MARGINS.top;
    var onTop = refPosition.top - ph - MARGINS.bottom;
    var top;

    // If this condition matches, the dialog has changed its size
    if (state.scroll === scroll) {
      // We maintain position unless there is no space
      if (state.position === 'top') {
        if (onTop <= 0) {
          top = onBottom;
          state.position = 'bottom';
        } else {
          top = onTop;
        }
      } else {
        if (onBottom + ph + MARGINS.bottom >= dh) {
          top = onTop;
          state.position = 'top';
        } else {
          top = onBottom;
        }
      }
    } else {
      if (onBottom + ph + MARGINS.bottom >= dh) {
        top = onTop;
        state.position = 'top';
      } else {
        top = onBottom;
        state.position = 'bottom';
      }
    }

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

    state.scroll = scroll;
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
    if (el) {
      el.parentNode.removeChild(el);
    }

    this.emitter = null;
    this.reference = null;
    this.popup = null;
  }
};

module.exports = Manager;
