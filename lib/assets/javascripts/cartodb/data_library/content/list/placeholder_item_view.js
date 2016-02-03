var cdb = require('cartodb.js-v3');

/**
 * Represents a map card on data library.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item MapsList-item--fake',
  tagName: 'li',

  initialize: function() {
    this.template = cdb.templates.getTemplate('data_library/content/list/placeholder_item_template');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template()
    );

    return this;
  },

});
