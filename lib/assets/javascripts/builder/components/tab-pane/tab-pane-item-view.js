var CoreView = require('backbone/core-view');
var _ = require('underscore');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

/**
 *  TabPaneItem component
 */

module.exports = CoreView.extend({
  module: 'components:tab-pane:tab-pane-item-view',

  tagName: 'button',

  className: function () {
    var classes = [this.options.klassName];

    if (this.model.get('selected')) {
      classes.push('is-selected');
    }

    if (this.model.get('disabled')) {
      classes.push('is-disabled');
    }

    return classes.join(' ');
  },

  events: {
    'click': '_onButtonClicked'
  },

  initialize: function () {
    if (!this.model) {
      throw new Error('A model should be provided');
    }

    this.model.bind('change:selected', this._onChangeSelected, this);
  },

  render: function () {
    var tooltip = this.model.get('tooltip');
    var view = this.model.get('createButtonView').call(this.model);
    this.addView(view);
    this.$el.append(view.render().$el);

    if (tooltip) {
      var buttonTooltip = new TipsyTooltipView({
        el: this.$el,
        title: function () {
          return _t(tooltip);
        },
        gravity: 'w'
      });
      this.addView(buttonTooltip);
    }

    return this;
  },

  _onChangeSelected: function () {
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
  },

  _onButtonClicked: function (event) {
    event.preventDefault();
    if (this.model.get('disabled')) return;

    this.model.set('selected', true);
    _.isFunction(this.model.get('onClick')) && this.model.get('onClick')();
  }
});
