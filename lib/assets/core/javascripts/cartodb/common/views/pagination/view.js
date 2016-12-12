var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
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

  className: 'Pagination CDB-Text CDB-Size-medium',

  events: {
    'click a': '_paginate'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/pagination/template');
    this.router = this.options.router;

    if (this.router && !this.model.hasUrl()) {
      throw new Error('since router is set the model must have a url method set too');
    }

    this.model.bind('change', this.render, this);
  },

  render: function() {
    if (this.model.shouldBeVisible()) {
      this.$el.html(
        this.template({
          m: this.model,
          pagesCount: this.model.pagesCount(),
          currentPage: this.model.get('current_page')
        })
      );
      this.$el.addClass(this.className);
      this.delegateEvents();
    } else {
      this.$el.html('');
    }

    return this;
  },

  _paginate: function(ev) {
    if (this.router) {
      navigateThroughRouter.apply(this, arguments);
    } else if (!this.model.hasUrl()) {
      this.killEvent(ev);
    }

    var page = $(ev.target).data('page');
    this.model.set('current_page', page);
  }
});
