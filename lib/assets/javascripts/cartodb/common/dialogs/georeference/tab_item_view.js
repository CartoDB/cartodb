var cdb = require('cartodb.js');

/**
 * View for an indvidual tab item
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'Filters-typeItem',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/tab_item')({
        label: this.model.tabLabel
      })
    );
    this._onChangeSelected(this.model, this.model.get('selected'));

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this._onChangeSelected, this);
  },

  _onChangeSelected: function(m, isSelected) {
    this.$('button').toggleClass('is-selected', !!isSelected);
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    this.model.set('selected', true);
  }
});
