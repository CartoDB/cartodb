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
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._initButton();
    this._initTooltip();
  },

  _initButton: function () {
    var view = this.model.get('createButtonView').call(this.model);
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _initTooltip: function () {
    var tooltip = this.model.get('tooltip');
    if (tooltip) {
      var buttonTooltip = new TipsyTooltipView({
        el: this.$el,
        title: function () {
          return _t(tooltip);
        },
        gravity: this.model.get('tooltipGravity') || 'w'
      });
      this._buttonTooltip = buttonTooltip;
      this.addView(buttonTooltip);
    }
  },

  _onChangeSelected: function () {
    var isSelected = !!this.model.get('selected');
    if (!isSelected) {
      this._buttonTooltip && this._buttonTooltip.hideTipsy();
    }
    this.$el.toggleClass('is-selected', isSelected);
  },

  _onButtonClicked: function (event) {
    event.preventDefault();
    if (this.model.get('disabled')) return;

    this.model.set('selected', true);
    _.isFunction(this.model.get('onClick')) && this.model.get('onClick')();
  },

  clean: function () {
    this._buttonTooltip && this._buttonTooltip.clean();
  }
});
