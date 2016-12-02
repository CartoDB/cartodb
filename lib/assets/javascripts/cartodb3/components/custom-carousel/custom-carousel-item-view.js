var CoreView = require('backbone/core-view');
var template = require('./custom-carousel-item.tpl');

module.exports = CoreView.extend({

  className: 'Carousel-item',
  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._itemClassName = opts && opts.itemOptions ? opts.itemOptions.className : '';
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        name: this.model.getName(),
        className: this._itemClassName,
        template: this.model.get('template')()
      })
    );
    this.$el.addClass('js-' + this.model.getValue());
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:selected', this.render, this);
  },

  _onMouseEnter: function () {
    this.model.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this.model.set('highlighted', false);
  },

  _onClick: function (e) {
    this.killEvent(e);
    this.model.set('selected', true);
  }
});
