var $ = require('jquery');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  render: function() {
    this.clearSubViews();

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/column_merge/choose_key_columns')({
        actualTableName: this.model.get('table').get('name')
      })
    );

    var $actualColumns = $el.find('.js-actual-columns');
    var $actualColumnElements = [];
    $actualColumns.append.apply($actualColumns, $actualColumnElements);

    this.$el.html($el);

    return this;
  }
});
