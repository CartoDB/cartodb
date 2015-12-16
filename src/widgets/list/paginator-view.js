var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-nav CDB-Widget-contentSpaced',

  _TEMPLATE: ' ' +
    '<span></span>' +
    '<div class="CDB-Widget-navArrows CDB-Widget-contentSpaced">' +
    '<button class="CDB-Shape-arrow CDB-Shape-arrow--up js-up"></button>' +
    '<button class="CDB-Shape-arrow CDB-Shape-arrow--down js-down"></button>' +
    '</div>',

  events: {
    'click .js-up': '_scrollUp',
    'click .js-down': '_scrollDown'
  },

  initialize: function () {
    if (!this.options.$target) {
      throw new Error('target should be defined in order to be able to paginate');
    }
    this._$target = this.options.$target;
    this._scrollHeight = this._$target.get(0).scrollHeight - this._$target.outerHeight();
    this._initBinds();
  },

  render: function () {
    var template = _.template(this._TEMPLATE);
    this.$el.html(template());
    this._checkScroll();
    return this;
  },

  _initBinds: function () {
    var self = this;
    this._$target.bind('scroll', function () {
      self._checkScroll();
    });
  },

  _unbindScroll: function () {
    this._$target.unbind('scroll');
  },

  _checkScroll: function () {
    var currentScroll = this._$target.scrollTop();
    this.$('.js-up').toggleClass('is-disabled', currentScroll === 0);
    this.$('.js-down').toggleClass('is-disabled', currentScroll >= this._scrollHeight);
  },

  _getEdgeVisibleItems: function () {
    var areaHeight = this._$target.outerHeight();
    var firstEl = null;
    var lastEl = null;
    var items = this._$target.children('.CDB-Widget-listItem');

    items.each(function (index, value) {
      var top = $(this).position().top;
      var height = $(this).outerHeight();

      if (top > -1 && firstEl === null) { // first entirely visible element
        firstEl = this;
      } else if ((top + height) > areaHeight && lastEl === null) {
        lastEl = items[index - 1]; // the last entirely visible was the element before
      }
    });

    return [firstEl, lastEl];
  },

  _scrollDown: function () {
    var lastVisibleItem = this._getEdgeVisibleItems()[1];
    var currentScroll = this._$target.scrollTop();
    var $next = $(lastVisibleItem).next();
    if ($next.length) {
      var top = $next.position().top;
      var height = $next.outerHeight();
      var scrollPos = top + height - this._$target.outerHeight() + currentScroll;
      if (scrollPos > 0) {
        this._$target.scrollTop(scrollPos);
      }
    }
  },

  _scrollUp: function () {
    var firstVisibleItem = this._getEdgeVisibleItems()[0];
    var currentScroll = this._$target.scrollTop();
    var $prev = $(firstVisibleItem).prev();
    if ($prev.length) {
      var top = $prev.position().top;
      var scrollPos = currentScroll + top;
      this._$target.scrollTop(scrollPos);
    }
  },

  clean: function () {
    this._unbindScroll();
    cdb.core.View.prototype.clean.call(this);
  }

});
