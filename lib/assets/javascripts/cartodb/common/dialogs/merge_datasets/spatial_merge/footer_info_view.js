var cdb = require('cartodb.js-v3');

/**
 * View to indicate the selected key columns relationship and merge method relationship.
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
    rightColumns.bind('change:selected', this._updatePieces, this);
    this.add_related_model(rightColumns);

    var mergeMethods = this.model.get('mergeMethods');
    mergeMethods.bind('change:selected', this._updatePieces, this);
    this.add_related_model(mergeMethods);
  },

  _updatePieces: function() {
    var selectedMergMethod = this.model.selectedMergeMethod();
    this.$('.js-merge-method-name').text(selectedMergMethod ? selectedMergMethod.NAME : '');

    if (this.model.isCountMergeMethod(selectedMergMethod)) {
      this._changeRightPiece(this.model.get('rightTableData').name);
    } else {
      var m = this.model.selectedRightMergeColumn();
      this._changeRightPiece(m ? m.get('name') : '');
    }
  },

  _changeRightPiece: function(text) {
    this.$('.js-right')
      .text(text || '')
      .toggleClass('is-placeholder', !text);
  }

});
