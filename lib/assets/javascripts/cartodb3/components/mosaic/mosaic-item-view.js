var cdb = require('cartodb.js');
var template = require('./mosaic-item.tpl');

module.exports = cdb.core.View.extend({

  className: 'Mosaic-item',
  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        name: this.model.getName(),
        template: this.model.get('template')()
      })
    );
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

  _onClick: function () {
    this.model.set('selected', true);
  }

});
