var cdb = require('cartodb.js');

/**
 * View to indicate the selected key columns relationship.
 * Shared for both step 1 and 2
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    var leftKeyColumn = this.model.get('leftKeyColumn');
    var rightKeyColumn = this.model.get('rightKeyColumn');
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/column_merge/footer_info')({
        leftKeyColumnName: leftKeyColumn ? leftKeyColumn.get('name') : '',
        rightKeyColumnName: rightKeyColumn ? rightKeyColumn.get('name') : ''
      })
    );
    return this;
  },

  _initBinds: function() {
    var leftColumns = this.model.get('leftColumns');
    leftColumns.bind('change:selected', this._changeText.bind(this, '.js-left-key-column'));
    this.add_related_model(leftColumns);

    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._changeText.bind(this, '.js-right-key-column'));
    this.add_related_model(rightColumns);
  },

  _changeText: function(selector, column, isSelected) {
    var $el = this.$(selector);
    if (isSelected) {
      $el.text(column.get('name'));
    }
    $el.toggleClass('is-placeholder', !isSelected);
  }

});
