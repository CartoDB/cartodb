var cdb = require('cartodb.js');
var template = require('./table-head-item.tpl');

/*
 *  Main table view
 */

module.exports = cdb.core.View.extend({

  className: 'Table-headerItem',
  tagName: 'th',

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        name: this.model.get('name'),
        type: this.model.get('type')
      })
    );
    return this;
  }

});
