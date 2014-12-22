var cdb = require('cartodb.js');

/**
 * Responsible for pagination.
 */
module.exports = cdb.core.View.extend({
  className: 'Pagination',

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/pagination/template');
    this.model.bind('change', this.render, this);
  },

  render: function() {
    this.$el.html(this.template({
      m: this.model
    }));

    return this;
  }
});
