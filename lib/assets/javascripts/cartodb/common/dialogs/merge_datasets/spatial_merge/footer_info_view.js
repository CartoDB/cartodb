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
    var rightColumns = this.model.get('rightColumns');
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/spatial_merge/footer_info')({
        leftTableName: this.model.get('leftTable').get('name'),
        rightColumnName: rightColumns ? rightColumns.get('name') : ''
      })
    );
    return this;
  },

  _initBinds: function() {
    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._onChangeRightColumn, this);
    this.add_related_model(rightColumns);

    var mergeMethods = this.model.get('mergeMethods');
    mergeMethods.bind('change:selected', this._onChangeMergeMethod, this);
    this.add_related_model(mergeMethods);
  },

  _onChangeRightColumn: function() {
    var m = this.model.selectedRightMergeColumn();
    this.$('.js-right-column-name')
      .text(m ? m.get('name') : '')
      .toggleClass('is-placeholder', !m);
  },

  _onChangeMergeMethod: function() {
    var m = this.model.selectedMergeMethod();
    this.$('.js-merge-method-name').text(m ? m.name : '');
  }

});
