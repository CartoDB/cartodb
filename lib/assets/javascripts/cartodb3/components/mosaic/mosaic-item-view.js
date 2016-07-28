var CoreView = require('backbone/core-view');
var template = require('./mosaic-item.tpl');

var DEFAULT_NAME = _t('editor.layers.basemap.custom-basemap');

module.exports = CoreView.extend({

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
        name: this._getName(),
        template: this.model.get('template')()
      })
    );
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
    return this;
  },

  _getName: function () {
    var name = this.model.getName();

    if (!name) {
      name = this.model.get('order') ? DEFAULT_NAME + ' ' + this.model.get('order') : DEFAULT_NAME;
    } else {
      name.replace(/_/g, '');
    }

    return name;
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
