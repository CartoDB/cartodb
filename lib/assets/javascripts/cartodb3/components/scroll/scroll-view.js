var cdb = require('cartodb.js');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var template = require('./scroll.tpl');

module.exports = cdb.core.View.extend({
  tagName: 'div',
  className: 'ScrollView',

  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('A factory createContentView function is required');
    this.options = opts || {};
    this._inDom = false;
    this._offset = 20;
  },

  render: function () {
    this.clearSubViews();

    var view = this.options.createContentView.call(this);

    this.destroyScroll();
    if (!this._$content) {
      this.$el.html(template());
      this._$content = this.$('.js-content');
      this._$wrapper = this.$('.js-wrapper');
      this._$shadowTop = this.$('.js-top');
      this._$shadowBottom = this.$('.js-bottom');
    } else {
      this._$content.clear();
    }

    this._$content.append(view.render().el);
    this.addView(view);
    this.addScroll();
    return this;
  },

  addScroll: function () {
    Ps.initialize(this._$wrapper.get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20,
      suppressScrollX: true
    });

    this._bindEvents();
  },

  _bindEvents: function () {
    this._interval = window.requestAnimationFrame(_.bind(this._onScroll, this));
  },

  _unbindEvents: function () {
    window.cancelAnimationFrame(this._interval);
  },

  _onScroll: function () {
    var max;
    var top;

    if (this._$content && this._$wrapper) {
      max = this._$content.outerHeight() - this._$wrapper.outerHeight();
      top = this._$wrapper.scrollTop();

      if (max > 0) {
        if (top < this._offset) {
          this._$shadowTop.hide();
          this._$shadowBottom.show();
        } else if (top > max - this._offset) {
          this._$shadowTop.show();
          this._$shadowBottom.hide();
        } else {
          this._$shadowTop.show();
          this._$shadowBottom.show();
        }
      }
    }

    this._interval = window.requestAnimationFrame(_.bind(this._onScroll, this));
  },

  destroyScroll: function () {
    if (!this._$wrapper) {
      return;
    }

    this._unbindEvents();
    Ps.destroy(this._$wrapper.get(0));
  },

  _destroyDOMRefs: function () {
    this._$wrapper = null;
    this._$content = null;
    this._$wrapper = null;
    this._$shadowTop = null;
    this._$shadowBottom = null;
  },

  clean: function () {
    this.destroyScroll();
    this._destroyDOMRefs();
    cdb.core.View.prototype.clean.apply(this, arguments);
  }
});
