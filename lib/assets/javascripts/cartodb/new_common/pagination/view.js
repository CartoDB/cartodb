var cdb = require('cartodb.js');

/**
 * Responsible for pagination.
 */
module.exports = cdb.core.View.extend({
  className: 'Pagination',

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/pagination/template');
  },

  render: function() {
    this.$el.html(this.template(_.extend({
        pagesCount: this.model.pagesCount()
      }, this.model.attributes)));

    return this;
  }
});
