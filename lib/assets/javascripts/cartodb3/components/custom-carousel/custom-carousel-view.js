var cdb = require('cartodb.js');
var Ps = require('perfect-scrollbar');
var template = require('./custom-carousel.tpl');
var CarouselCollection = require('./custom-carousel-collection');
var CarouselItemView = require('./custom-carousel-item-view');

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

module.exports = cdb.core.View.extend({

  className: 'Carousel',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new CarouselCollection(opts.options);
    }
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
    this.collection.each(function (mdl) {
      this._createItem(mdl);
    }, this);
  },

  _createItem: function (mdl) {
    var view = new CarouselItemView({
      model: mdl
    });
    this._listContainer().append(view.render().el);
    this.addView(view);
  },

  _applyCustomScroll: function () {
    Ps.initialize(this._listContainer().get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      suppressScrollY: true,
      minScrollbarLength: 20
    });

    this._bindScroll();
    this._checkScroll();
    this._checkShadows();
  },

  _destroyCustomScroll: function () {
    this._unbindScroll();
    Ps.destroy(this._listContainer().get(0));
  },

  _bindScroll: function () {
    this._listContainer()
      .on('ps-x-reach-start', this._checkShadows.bind(this))
      .on('ps-x-reach-end', this._checkShadows.bind(this))
      .on('ps-scroll-x', this._checkShadows.bind(this));
  },

  _unbindScroll: function () {
    this._listContainer()
      .off('ps-x-reach-start', this._checkShadows.bind(this))
      .off('ps-x-reach-end', this._checkShadows.bind(this))
      .off('ps-scroll-x', this._checkShadows.bind(this));
  },

  _checkScroll: function () {
    var position = this.$('.is-selected').position();
    if (position) {
      this._listContainer().scrollLeft(position.left - 3);
    }
  },

  _listContainer: function () {
    return this.$('.js-list');
  },

  _checkShadows: function () {
    var currentPos = this._listContainer().scrollLeft();
    var max = this._listContainer().get(0).scrollWidth;
    var height = this._listContainer().outerWidth();
    var maxPos = max - height;
    this.$('.js-leftShadow').toggleClass('is-visible', currentPos > 0);
    this.$('.js-rightShadow').toggleClass('is-visible', currentPos < maxPos);
  },

  clean: function () {
    this._destroyCustomScroll();
    cdb.core.View.prototype.clean.apply(this);
  }

});
