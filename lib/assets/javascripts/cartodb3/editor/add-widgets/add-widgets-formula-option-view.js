var cdb = require('cartodb.js');
var template = require('./add-widgets-formula-option.tpl');

/**
 * View for an individual formula widget option item
 */
module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },

  render: function () {
    this.$el.html(
      template({
        columnName: this.model.get('name'),
        isSelected: this.model.get('selected')
      })
    );
    return this;
  },

  _onClick: function () {
    this.model.set('selected', !this.model.get('selected'));
  }
});
