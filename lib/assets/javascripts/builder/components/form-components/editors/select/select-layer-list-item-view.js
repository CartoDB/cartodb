var CoreView = require('backbone/core-view');
var _ = require('underscore');

module.exports = CoreView.extend({

  options: {
    template: require('./select-layer-list-item.tpl')
  },

  className: 'CDB-ListDecoration-item CustomList-item js-listItem',
  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(
      this.options.template(
        _.extend({
          typeLabel: this.options.typeLabel,
          isSelected: this.model.get('selected'),
          isDestructive: this.model.get('destructive'),
          layerName: this.model.get('layerName'),
          nodeTitle: this.model.get('nodeTitle'),
          color: this.model.get('color'),
          layer_id: this.model.get('layer_id'),
          isSourceType: this.model.get('isSourceType')
        })
      )
    );

    this.$el.attr('data-val', this.model.getValue());

    return this;
  },

  _onMouseLeave: function () {
    this.$el.removeClass('is-highlighted');
  },

  _onMouseEnter: function () {
    this.$el.addClass('is-highlighted');
  },

  _onClick: function (e) {
    e.stopPropagation();
    this.model.set('selected', true);
  }
});
