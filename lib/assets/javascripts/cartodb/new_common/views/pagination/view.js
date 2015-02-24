var cdb = require('cartodb.js');
var navigateThroughRouter = require('../../view_helpers/navigate_through_router');

/**
 * Responsible for pagination.
 *
 * Expected to be created with a pagination model, see the model for available params, here we create w/ the minimum:
 *   new PaginationView({
 *     model: new PaginationModel({
 *       // Compulsory:
 *       urlTo:  function(page) { return '/?page='+ page },

         // Optional, to router clicks on <a> tags through router.navigate by default
 *       router: new Router(...)
 *     })
 *   });
 */
module.exports = cdb.core.View.extend({

  className: 'Pagination',

  initialize: function(args) {
    this.template = cdb.templates.getTemplate('new_common/views/pagination/template');

    if (args.router) {
      this.router = args.router;
      this.events = {
        'click a': navigateThroughRouter
      };
    }

    this.model.bind('change', this.render, this);
  },

  render: function() {
    if (this.model.get('total_count') > 0) {
      this.$el.html(this.template({
        m: this.model,
        pagesCount: this.model.pagesCount(),
        currentPage: this.model.get('current_page')
      }));
    } else {
      this.$el.html('');
    }
    this.$el.addClass(this.className);
    this.delegateEvents();

    return this;
  }
});
