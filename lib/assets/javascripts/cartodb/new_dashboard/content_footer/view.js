var cdb = require('cartodb.js');
var PaginationModel = require('new_common/pagination/model');
var PaginationView = require('new_common/pagination/view');

/**
 * Responsible for the content footer of the layout.
 *  ___________________________________________________________________________
 * |                                                                           |
 * | [show your locked datasets/maps]           Page 2 of 42 [1] 2 [3][4][5]  |
 * |___________________________________________________________________________|
 *
 */
module.exports = cdb.core.View.extend({
  initialize: function(args) {
    if (!args.el) throw new Error('The root element must be provided from parent view');

    this.collection = args.collection;
    this.router = args.router;
    this.router.model.bind('change', this.render, this);

    this.add_related_model(this.router);

    this._paginationView = this._createPaginationView(this.collection, this.router);
  },

  render: function() {
    this.clearSubViews();

    this._renderShowLockedLink();
    this._renderPaginationView();

    return this;
  },

  _renderShowLockedLink: function() {
    // TODO: implement later
  },

  _createPaginationView: function(collection, router) {
    var model = new PaginationModel({
      current_page: router.model.get('page'),
      url_to:       function(page) { return router.model.url({ page: page }) }
    });

    // Some properties (e.g. total_entries) cannot be observed, so listen to all changes and update model accordingly
    collection.bind('change reset', _.partial(this._updatePaginationModelFromCollection, model, collection));
    router.model.bind('change', _.partial(this._updatePaginationModelFromRouter, model, router.model));

    var view = new PaginationView({
      model:  model,
      router: this.router
    });
    this.addView(view);

    return view;
  },

  _updatePaginationModelFromCollection: function(model, collection) {
    model.set({
      per_page:    collection.options.get('per_page'),
      total_count: collection.total_entries
    });
  },

  _updatePaginationModelFromRouter: function(model, routerModel) {
    model.set('current_page', routerModel.get('page'));
  },

  _renderPaginationView: function() {
    this._paginationView.render();
    this.$el.append(this._paginationView.el);
  }
});
