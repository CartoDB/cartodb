var cdb = require('cartodb.js');

/**
 * View to select one or multiple columns.
 *  - For only allowing selecting one set selectorType to 'radio'
 *  - For allowing multiple selections set selectorType to 'switch'
 */
module.exports = cdb.core.View.extend({

  className: 'List-row',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    if (!this.options.selectorType) throw new Error('selectorType is required');

    this.model = new cdb.core.Model({
      type: this.options.selectorType
    });

    this.column = this.options.column;

    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/column_selector')({
        selectorType: this.model.get('type'),
        columnName: this.column.get('name'),
        columnType: this.column.get('type')
      })
    );

    this._onChangeSelected(this.column, this.column.get('selected'));
    this._onChangeDisabled(this.column, this.column.get('disabled'));

    return this;
  },

  _initBinds: function() {
    this.column.bind('change:selected', this._onChangeSelected, this);
    this.column.bind('change:disabled', this._onChangeDisabled, this);
    this.add_related_model(this.column);
  },

  _onChangeSelected: function(column, isSelected) {
    if (this.model.get('type') === 'radio') {
      this.$el.toggleClass('is-selected', !!isSelected);
    }
    this.$('.js-radio').toggleClass('is-checked', !!isSelected);
    this.$('.js-switch').prop('checked', !!isSelected);
  },

  _onChangeDisabled: function(column, isDisabled) {
    this.$el.toggleClass('is-disabled', !!isDisabled);
    if (isDisabled) {
      this.undelegateEvents();
    } else {
      this.delegateEvents();
    }
  },

  _onClick: function(ev) {
    this.killEvent(ev);

    var inverseSelectedVal = !this.column.get('selected');

    // radio buttons can only be selected, unselection of other items should be handled by collection/parent
    if (inverseSelectedVal || this.model.get('type') !== 'radio') {
      this.column.set('selected', inverseSelectedVal);
    }
  }

});
