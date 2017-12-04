var CoreView = require('backbone/core-view');
var Ps = require('perfect-scrollbar');
var template = require('./custom-carousel.tpl');
var CarouselCollection = require('./custom-carousel-collection');
var CarouselItemView = require('./custom-carousel-item-view');
var _ = require('underscore');
/*
 *  A custom carousel selector
 *
 *  It accepts a collection of (val, label) model attributes or a values array
 *  with the same content or only strings.
 *
 *  new CustomCarousel({
 *    options: [
 *      {
 *        val: 'hello',
 *        label: 'hi'
 *      }
 *    ]
 *  });
 */

module.exports = CoreView.extend({

  className: 'Carousel',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new CarouselCollection(opts.options);
      this.options = opts;
    }
    this._bindedCheckShadows = this._checkShadows.bind(this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderList();
    this._applyCustomScroll();
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._checkScroll, this);
  },

  _renderList: function () {
    this.collection.each(function (model) {
      this._createItem(model);
    }, this);
  },

  _createItem: function (model) {
    var opts = this.options;
    var className = opts && opts.listItemOptions ? opts.listItemOptions.className : 'Carousel-item';
    var view = new CarouselItemView({
      className: className,
      model: model,
      itemOptions: this.options.itemOptions
    });

    this._listContainer().append(view.render().el);
    this.addView(view);
  },

  _applyCustomScroll: function () {
    Ps.initialize(this._listContainer().get(0), {
      wheelSpeed: 1,
      wheelPropagation: false,
      swipePropagation: true,
      suppressScrollY: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 120,
      useBothWheelAxes: true
    });
    this._checkScroll();
    this._bindScroll();
  },

  _destroyCustomScroll: function () {
    this._unbindScroll();
    Ps.destroy(this._listContainer().get(0));
  },

  _bindScroll: function () {
    this._listContainer()
      .on('ps-x-reach-start', this._bindedCheckShadows)
      .on('ps-x-reach-end', this._bindedCheckShadows)
      .on('ps-scroll-x', this._bindedCheckShadows);
  },

  _unbindScroll: function () {
    this._listContainer()
      .off('ps-x-reach-start', this._bindedCheckShadows)
      .off('ps-x-reach-end', this._bindedCheckShadows)
      .off('ps-scroll-x', this._bindedCheckShadows);
  },

  _checkScroll: function () {
    var position = this.$('.is-selected').position();
    if (position) {
      this._listContainer().scrollLeft(position.left - 20);
      this._bindedCheckShadows();
    }
  },

  _listContainer: function () {
    return this.$('.js-list');
  },

  _checkShadows: function () {
    var currentPos = this._listContainer().scrollLeft();
    var max = this._listContainer().get(0).scrollWidth;
    var width = this._listContainer().outerWidth();
    var maxPos = max - width;

    this.$('.js-leftShadow').toggleClass('is-visible', currentPos > 0);
    this.$('.js-rightShadow').toggleClass('is-visible', currentPos < maxPos);
  },

  clean: function () {
    this._destroyCustomScroll();
    CoreView.prototype.clean.apply(this);
  },

  initScroll: function () {
    setTimeout(_.bind(function () {
      this._checkShadows();
      this._checkScroll();
      Ps.update(this._listContainer().get(0));
    }, this), 0);
  }

});
