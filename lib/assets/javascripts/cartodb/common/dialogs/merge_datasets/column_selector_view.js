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
    this.elder('initialize');

    this.model = new cdb.core.Model({
      type: this.options.selectorType
    });

    this.column = this.options.column;
    this.add_related_model(this.column);

    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/column_selector')({
        selectorType: this.model.get('type'),
        isSelected: this.column.get('selected'),
        columnName: this.column.get('name'),
        columnType: this.column.get('type')
      })
    );

    var isDisabled = this.column.get('disabled');
    if (isDisabled) {
      this.undelegateEvents();
      this.$el.toggleClass('is-disabled', isDisabled);
    }

    return this;
  },

  _initBinds: function() {
    this.column.bind('change:selected', this._onChangeSelected, this);
  },

  _onChangeSelected: function(column, isSelected) {
    if (this.model.get('type') === 'radio') {
      this.$el.toggleClass('is-selected', isSelected);
    }
    this.$('.js-radio').toggleClass('is-checked', isSelected);
    this.$('.js-switch').prop('checked', isSelected);
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
