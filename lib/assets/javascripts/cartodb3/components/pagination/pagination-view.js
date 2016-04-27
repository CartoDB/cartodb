var cdb = require('cartodb.js');
var $ = require('jquery');
var navigateThroughRouter = require('../../helpers/navigate-through-router');
var template = require('./pagination.tpl');

/**
 * Responsible for pagination.
 *
 * Expected to be created with a pagination model, see the model for available params, here we create w/ the minimum:
 *   new PaginationView({
 *     model: new PaginationModel({
 *       // Compulsory:
 *       urlTo:  function(page) { return '/?page='+ page },

         // Optional, to router clicks on <a> tags through router.navigate by default
 *       routerModel: new Router(...)
 *     })
 *   });
 */
module.exports = cdb.core.View.extend({
  className: 'Pagination',

  events: {
    'click a': '_paginate'
  },

  initialize: function (opts) {
    this._routerModel = opts.routerModel; // Optional

    if (this.router && !this.model.hasUrl()) {
      throw new Error('since router is set the model must have a url method set too');
    }

    this.model.bind('change', this.render, this);
  },

  render: function () {
    if (this.model.shouldBeVisible()) {
      this.$el.html(
        template({
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

  _paginate: function (ev) {
    if (this._routerModel) {
      navigateThroughRouter.apply(this, arguments);
    } else if (!this.model.hasUrl()) {
      this.killEvent(ev);
    }

    var page = $(ev.target).data('page');
    this.model.set('current_page', page);
  }
});
