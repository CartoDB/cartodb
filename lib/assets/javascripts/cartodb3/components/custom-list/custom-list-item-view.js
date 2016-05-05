var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./custom-list-item.tpl');

module.exports = cdb.core.View.extend({

  className: 'CDB-ListDecoration-item CustomList-item js-listItem',
  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    this.template = opts.template || template;
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(
      this.template(
        _.extend({
          typeLabel: this.options.typeLabel,
          isSelected: this.model.get('selected'),
          name: this.model.getName()
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
