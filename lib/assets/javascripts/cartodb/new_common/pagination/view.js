var cdb = require('cartodb.js');

/**
 * Responsible for pagination.
 *
 * Expected to be created with a pagination model, see the model for available params, here we create w/ the minimum:
 *   new PaginationView({
 *     model: new PaginationModel({
 *       // Minimum compulsory:
 *       urlTo: function(page) { return '/?page='+ page }
 *     })
 *   });
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
