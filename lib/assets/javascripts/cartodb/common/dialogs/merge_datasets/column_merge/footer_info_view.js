var cdb = require('cartodb.js-v3');

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
    if (this.model.selectedItemFor) {
      var leftColumns = this.model.get('leftColumns');
      leftColumns.bind('change:selected', this._onChangeLeftColumn, this);
      this.add_related_model(leftColumns);

      var rightColumns = this.model.get('rightColumns');
      rightColumns.bind('change:selected', this._onChangeRightColumn, this);
      this.add_related_model(rightColumns);
    }
  },

  _onChangeLeftColumn: function() {
    var m = this.model.selectedItemFor('leftColumns');
    this.$('.js-left-key-column').text(m ? m.get('name') : '');
  },

  _onChangeRightColumn: function() {
    var m = this.model.selectedItemFor('rightColumns');
    this.$('.js-right-key-column')
      .text(m ? m.get('name') : '')
      .toggleClass('is-placeholder', !m);
  }

});
