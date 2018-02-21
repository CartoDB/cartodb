var CoreView = require('backbone/core-view');
var template = require('./custom-carousel-item.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

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
    this.clearSubViews();

    this.$el.html(
      template({
        name: this.model.getName(),
        className: this._itemClassName,
        template: this.model.get('template')()
      })
    );

    if (this.model.getValue()) {
      this.$el.addClass('js-' + this.model.getValue());
    }
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));

    this._initViews();

    return this;
  },

  _initViews: function () {
    if (this.model.get('tooltip')) {
      var tooltip = new TipsyTooltipView({
        el: this.$el,
        gravity: 's',
        title: function () {
          return this.model.get('tooltip');
        }.bind(this)
      });
      this.addView(tooltip);
    }
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
