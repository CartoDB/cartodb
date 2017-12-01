var CoreView = require('backbone/core-view');
var TipsyTooltipView = require('../tipsy-tooltip-view.js');

/**
 *  TabPaneItem component
 */

module.exports = CoreView.extend({
  module: 'components:tab-pane:tab-pane-item-view',

  tagName: 'button',

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
    var view = this.model.get('createButtonView').call(this.model);
    this.addView(view);
    this.$el.append(view.render().$el);
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
    this.$el.toggleClass('is-disabled', !!this.model.get('disabled'));

    this._initViews();
    return this;
  },

  _initViews: function () {
    var tooltip = this.model.get('tooltip');
    if (typeof tooltip === 'undefined') {
      return;
    }

    this.tooltip = new TipsyTooltipView({
      el: this.$el,
      gravity: 's',
      title: function () {
        return tooltip;
      }
    });

    this.addView(this.tooltip);
  },

  _onChangeSelected: function () {
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
  },

  _onButtonClicked: function (event) {
    event.preventDefault();
    if (this.model.get('disabled')) return;

    this.model.set('selected', true);
  }
});
