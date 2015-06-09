var cdb = require('cartodb.js');

/**
 * View to select one or multiple columns.
 *  - For only allowing selecting one set selectorType to 'radio'
 *  - For allowing multiple selections set selectorType to 'switch'
 */
module.exports = cdb.core.View.extend({

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
      this.getTemplate('common/dialogs/merge_datasets/column_' + this.model.get('type') + '_selector')({
        // TODO: columns from a schema are returned as an array… why not have/use a model with proper attrs to begin with?
        columnName: this.column.get('0'),
        columnType: this.column.get('1'),
        isSelected: this.column.get('selected')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.column.bind('change:selected', this._onChangeSelected, this);
  },

  _onChangeSelected: function(column, isSelected) {
    this.$el.toggleClass('is-selected', isSelected);
    this.$('.js-radio').toggleClass('is-checked', isSelected);
  },

  _onClick: function(ev) {
    this.killEvent(ev);

    var isSelected = !this.column.get('selected');

    // radio buttons can only be selected, unselection of other items should be handled by collection/parent
    if (isSelected || this.model.get('type') !== 'radio') {
      this.column.set('selected', isSelected);
    }
  }

});
