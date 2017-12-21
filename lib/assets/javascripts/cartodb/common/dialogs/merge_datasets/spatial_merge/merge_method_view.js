var cdb = require('cartodb.js-v3');

/**
 * View to render a individual merge method.
 */
module.exports = cdb.core.View.extend({

  className: 'TabLink TabLink--positive TabLink--textCenterUpcase',

  events: {
    'hover': '_onHover',
    'mouseout': '_onMouseOut',
    'click': '_onClick'
  },

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    var isDisabled = this.model.get('disabled');

    this.$el
      .text(this.model.NAME)
      .toggleClass('disabled', isDisabled)
      .toggleClass('selected', this.model.get('selected') && !isDisabled);

    if (isDisabled) {
      this._tooltipView().show();
    }

    return this;
  },

  _tooltipView: function() {
    if (!this._tooltip) {
      this._tooltip = new cdb.common.TipsyTooltip({
        el: this.$el,
        trigger: 'manual',
        title: function() {
          // For now there's only one reason why a merge method would be disabled, so inline it here.
          // If there are more methods set the reason as an attr on the model instead, and update that attr based on state
          return 'Select a column of type number to use this merge method';
        }
      });
      this.addView(this._tooltip);
    }
    return this._tooltip;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this.render, this);
    this.model.bind('change:disabled', this.render, this);
  },

  _onHover: function(ev) {
    this.killEvent(ev);
    if (this.model.get('disabled')) {
      this._tooltip.showTipsy();
    }
  },

  _onMouseOut: function(ev) {
    this.killEvent(ev);
    if (this._tooltip) {
      this._tooltip.hideTipsy();
    }
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    if (!this.model.get('disabled')) {
      this.model.set('selected', true);
    }
  }

});
