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

    // TODO: this bind (with a 3rd arg) doesn't work, the callback is never called upon change events!
    //this.model.bind('change', this.render, this);
    this.model.bind('change', this.render.bind(this));
  },

  render: function() {
    if (this.model.get('total_count') > 0) {
      this.$el.html(this.template({
        m: this.model
      }));
    } else {
      this.$el.html('');
    }

    return this;
  }
});
