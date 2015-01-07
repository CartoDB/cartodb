var cdb = require('cartodb.js');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');

/**
 * Responsible for pagination.
 *
 * Expected to be created with a pagination model, see the model for available params, here we create w/ the minimum:
 *   new PaginationView({
 *     model: new PaginationModel({
 *       // Minimum compulsory:
 *       urlTo:  function(page) { return '/?page='+ page },
 *       router: new Router(...)
 *     })
 *   });
 */
module.exports = cdb.core.View.extend({
  className: 'Pagination',

  events: {
    'click a': handleAHref
  },

  initialize: function(args) {
    this.template = cdb.templates.getTemplate('new_common/views/pagination/template');
    this.router = args.router;

    this.model.bind('change', this.render, this);
  },

  render: function() {
    if (this.model.get('total_count') > 0) {
      this.$el.html(this.template({
        m: this.model
      }));
    } else {
      this.$el.html('');
    }
    this.delegateEvents();

    return this;
  }
});
