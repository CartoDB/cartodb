var cdb = require('cartodb.js-v3');

/**
 * Sticky header, should be displayed when the key columns goes out of view
 */
module.exports = cdb.core.View.extend({

  className: 'MergeDatasets-stickyHeader',
  attributes: {
    style: 'display: none'
  },

  render: function() {
    var leftKeyColumn = this.options.leftKeyColumn;
    var rightKeyColumn = this.options.rightKeyColumn;

    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/sticky_header')({
        leftColumnName: leftKeyColumn.get('name'),
        leftColumnType: leftKeyColumn.get('type'),
        rightColumnName: rightKeyColumn.get('name'),
        rightColumnType: rightKeyColumn.get('type'),
        addRadioPlaceholder: this.options.addRadioPlaceholder
      })
    );
    return this;
  }
});
