var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var Ps = require('perfect-scrollbar');
var template = require('./scroll.tpl');

module.exports = Backbone.View.extend({
  tagName: 'div',
  className: 'ScrollView',

  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('A factory createContentView function is required');
    this.options = opts || {};
    this._inDom = false;
    this._offset = 20;
  },

  render: function () {
    var view = this.options.createContentView.call(null);

    this.destroyScroll();
    if (!this._content) {
      this.$el.html(template());
      this._content = this.$('.js-content');
      this._wrapper = this.$('.js-wrapper');
      this._shadowTop = this.$('.js-top');
      this._shadowBottom = this.$('.js-bottom');
    } else {
      this._content.clear();
    }

    this._content.append(view.render().el);
    this.addScroll();
    this._initHeight();
    return this;
  },

  // FIXME: we are forcing the height to fill the remain space
  // Try to do this using css flexbox.
  _initHeight: function () {
    function polling () {
      if (this.$el && this.$el.outerHeight() !== 0) {
        this._inDom = true;
        this._updateHeight();
        window.cancelAnimationFrame(raf);
      } else {
        raf = window.requestAnimationFrame(_.bind(polling, this));
      }
    }

    var raf = window.requestAnimationFrame(_.bind(polling, this));
  },

  // FIXME: When flexbox, this will go away
  _updateHeight: function () {
    var h;

    if (this._inDom) {
      h = $(window).height() - this.$el.offset().top - 66; // toggle bar
      this._wrapper.css('height', h);
    }
  },

  addScroll: function () {
    Ps.initialize(this._wrapper.get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20,
      suppressScrollX: true
    });

    this._bindEvents();
  },

  _bindEvents: function () {
    this._interval = window.requestAnimationFrame(_.bind(this._onScroll, this));
    $(window).on('resize.scroll', _.bind(_.debounce(this._updateHeight, 100, true), this));
  },

  _unbindEvents: function () {
    window.cancelAnimationFrame(this._interval);
    $(window).off('resize.scroll');
  },

  _onScroll: function () {
    var max;
    var top;

    if (this._content && this._wrapper) {
      max = this._content.outerHeight() - this._wrapper.outerHeight();
      top = this._wrapper.scrollTop();

      if (max > 0) {
        if (top < this._offset) {
          this._shadowTop.hide();
          this._shadowBottom.show();
        } else if (top > max - this._offset) {
          this._shadowTop.show();
          this._shadowBottom.hide();
        } else {
          this._shadowTop.show();
          this._shadowBottom.show();
        }
      }
    }

    this._interval = window.requestAnimationFrame(_.bind(this._onScroll, this));
  },

  destroyScroll: function () {
    if (!this._wrapper) {
      return;
    }

    this._unbindEvents();
    Ps.destroy(this._wrapper.get(0));
  },

  remove: function () {
    this.destroyScroll();
    Backbone.View.prototype.remove.apply(this, arguments);
  },

  clean: function () {
    this.trigger('clean');
    this.remove();
  }
});
