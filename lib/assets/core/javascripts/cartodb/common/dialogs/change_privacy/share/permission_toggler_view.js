var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

/**
 * View for an individual access toggler.
 */
module.exports = cdb.core.View.extend({

  tagName: 'span',

  events: {
    'mouseover .js-toggler.is-disabled': '_onHoverDisabledToggler',
    'mouseout .js-toggler': '_closeTooltip',
    'mouseleave .js-toggler': '_closeTooltip',
    'change .js-input': '_onChangeInput'
  },

  initialize: function() {
    _.each(['model', 'permission', 'hasAccess', 'canChangeAccess', 'toggleAccess', 'label'], function(name) {
      if (_.isUndefined(this.options[name])) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/change_privacy/share/permission_toggler')({
        cid: this.cid,
        hasAccess: this.options.hasAccess(),
        canChangeAccess: this.options.canChangeAccess(),
        label: this.options.label
      })
    );
    return this;
  },

  _onChangeInput: function() {
    this.options.toggleAccess();
  },

  _onHoverDisabledToggler: function(ev) {
    var aclItem = this.options.permission.findRepresentableAclItem(this.model);
    if (aclItem && !aclItem.isOwn(this.model)) {
      this._tooltipView().showTipsy();
    }
  },

  _closeTooltip: function() {
    this._tooltipView().hideTipsy();
  },

  _tooltipView: function(el) {
    if (!this._tooltip) {
      this._tooltip = this._newTooltipView();
      this.addView(this._tooltip);
    }
    return this._tooltip;
  },

  _newTooltipView: function(el) {
    return new cdb.common.TipsyTooltip({
      el: this.$('.js-toggler'),
      trigger: 'manual',
      title: this._inheritedAccessTooltipText.bind(this)
    });
  },

  _inheritedAccessTooltipText: function() {
    var aclItem = this.options.permission.findRepresentableAclItem(this.model);
    var type = aclItem.get('type');
    switch(type) {
      case 'group':
        return 'Access is inherited from group ' + aclItem.get('entity').get('name');
      case 'org':
        return 'Access is inherited from organization';
      default:
        cdb.log.error('Trying to display inherited access for an unrecognized type ' + type)
        return ''
    }
  }

});
