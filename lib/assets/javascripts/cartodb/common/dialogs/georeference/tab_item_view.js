var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View for an indvidual tab item
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'Filters-typeItem',

  events: {
    'click .js-btn:not(.is-disabled)': '_onClick'
  },

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.getTemplate('common/dialogs/georeference/tab_item')({
        label: this.model.tabLabel,
        isDisabled: this.model.get('disabled')
      })
    );
    this._onChangeSelected(this.model, this.model.get('selected'));
    this._createDisabledTooltip();

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this._onChangeSelected, this);
  },

  _onChangeSelected: function(m, isSelected) {
    this.$('button').toggleClass('is-selected', !!isSelected);
  },

  _createDisabledTooltip: function() {
    var msg = this.model.get('disabled');
    if (!_.isEmpty(msg)) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.js-btn'),
          fallback: msg,
          gravity: 's',
          offset: -30
        })
      );
    }
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    this.model.set('selected', true);
  }
});
