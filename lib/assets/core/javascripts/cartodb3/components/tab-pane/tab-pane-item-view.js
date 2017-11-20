var CoreView = require('backbone/core-view');
var TipsyTooltipView = require('../tipsy-tooltip-view');

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

    var tooltip = new TipsyTooltipView({
      el: this.$el,
      title: function () {
        return _t(this.model.get('tooltip'));
      }.bind(this),
      gravity: 'w'
    });
    this.addView(tooltip);

    return this;
  },

  _onChangeSelected: function () {
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
  },

  _onButtonClicked: function (e) {
    e.preventDefault();
    this.model.set('selected', true);
  }
});
