var cdb = require('cartodb.js-v3');
var CreateDialog = require('../../common/dialogs/create/create_view');
var template = require('./placeholder_item.tpl');

/**
 * Represents a map card on dashboard.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  render: function() {
    this.clearSubViews();

    this.$el.html(
      template({
        desc: this.model.get('short_description'),
        url: this.model.get('guide_url'),
        icon: this.model.get('icon')
      })
    );

    return this;
  }
});
