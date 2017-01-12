var CoreView = require('backbone/core-view');
var Ps = require('perfect-scrollbar');
var template = require('./scroll.tpl');

module.exports = CoreView.extend({
  tagName: 'div',
  className: 'ScrollView',

  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('A factory createContentView function is required');
    this.options = opts || {};
    this._type = opts.type || 'vertical'; // vertical or horizontal
    this._maxScroll = 0;
    this._bindedCheckShadows = this._checkShadows.bind(this);
  },

  render: function () {
    this.clearSubViews();
    this._html();

    var view = this.options.createContentView.call(this);
    this._contentContainer().append(view.render().el);
    this.addView(view);
    this._applyScroll();
    return this;
  },

  _html: function () {
    this.$el.html(template({
      type: this._type
    }));

    (this._type === 'horizontal') && this.$el.addClass('ScrollView--horizontal');
  },

  _contentContainer: function () {
    return this.$('.js-content');
  },

  _wrapperContainer: function () {
    return this.$('.js-wrapper');
  },

  _applyScroll: function () {
    Ps.initialize(this._wrapperContainer().get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 20,
      suppressScrollX: this._type === 'vertical',
      suppressScrollY: this._type === 'horizontal'
    });

    this._bindScroll();
  },

  _bindScroll: function () {
    this._wrapperContainer()
      .on('ps-x-reach-start', this._bindedCheckShadows)
      .on('ps-x-reach-end', this._bindedCheckShadows)
      .on('ps-y-reach-start', this._bindedCheckShadows)
      .on('ps-y-reach-end', this._bindedCheckShadows)
      .on('ps-scroll-x', this._bindedCheckShadows)
      .on('ps-scroll-y', this._bindedCheckShadows);
  },

  _unbindScroll: function () {
    this._wrapperContainer()
      .off('ps-x-reach-start', this._bindedCheckShadows)
      .off('ps-x-reach-end', this._bindedCheckShadows)
      .off('ps-y-reach-start', this._bindedCheckShadows)
      .off('ps-y-reach-end', this._bindedCheckShadows)
      .off('ps-scroll-x', this._bindedCheckShadows)
      .off('ps-scroll-y', this._bindedCheckShadows);
  },

  _checkShadows: function () {
    var currentPos;
    var max;
    var width;
    var height;
    var maxPos;

    if (this._type === 'horizontal') {
      currentPos = this._wrapperContainer().scrollLeft();
      max = this._wrapperContainer().get(0).scrollWidth;
      width = this._wrapperContainer().outerWidth();
      maxPos = max - width;

      this.$('> .js-leftShadow').toggleClass('is-visible', currentPos > 0);
      this.$('> .js-rightShadow').toggleClass('is-visible', currentPos < maxPos);
    } else {
      currentPos = this._wrapperContainer().scrollTop();
      max = this._wrapperContainer().get(0).scrollHeight;
      height = this._wrapperContainer().outerHeight();
      maxPos = max - height;

      // We use the direct descendant selector to avoid affect others nested view with scroll
      this.$('> .js-topShadow').toggleClass('is-visible', currentPos > 0);
      this.$('> .js-bottomShadow').toggleClass('is-visible', currentPos < maxPos);
    }
  },

  destroyScroll: function () {
    this._unbindScroll();
    Ps.destroy(this._wrapperContainer().get(0));
  },

  clean: function () {
    this.destroyScroll();
    CoreView.prototype.clean.apply(this, arguments);
  }
});
