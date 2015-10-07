var cdb = require('cartodb.js');

/**
 * Represents a map card on data library.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  initialize: function() {
    this.template = cdb.templates.getTemplate('placeholder_item_template');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template({
        desc: this.model.get('short_description'),
        icon: this.model.get('icon')
      })
    );

    return this;
  },

});
