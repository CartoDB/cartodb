var _ = require('underscore');
var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-qualitative-ramps:color-ramps-list:list-item-view:color-ramps-list-item-view',

  className: 'CDB-ListDecoration-item CustomList-item CustomList-item--invert js-listItem',

  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click .js-listItemLink': '_onClick'
  },

  initialize: function (opts) {
    this.options = _.extend({}, this.options, opts);
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(
      this.options.template(
        {
          typeLabel: this.options.typeLabel,
          isSelected: this.model.get('selected'),
          isDisabled: this.model.get('disabled'),
          isDestructive: this.model.get('destructive'),
          name: this.model.getName(),
          val: this.model.getValue(),
          options: this.model.get('renderOptions')
        }
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'))
      .toggleClass('is-selected', !!this.model.get('selected'));

    return this;
  },

  _onMouseLeave: function () {
    this.$el.removeClass('is-highlighted');
  },

  _onMouseEnter: function () {
    this.$el.addClass('is-highlighted');
  },

  _onClick: function (ev) {
    this.killEvent(ev);

    if (this.model.get('selected')) {
      this.trigger('customEvent', 'customize', this.model.getValue(), this);
    } else {
      this.model.set('selected', true);
    }
  }
});
