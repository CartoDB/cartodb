var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');

/**
 *  Fake dataset view on dashboard
 */

module.exports = cdb.core.View.extend({

  className: 'DatasetsList-item DatasetsList-item--fake',
  tagName: 'li',

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/views/fake_datasets_item');
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  }

});
