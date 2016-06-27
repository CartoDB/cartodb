var cdb = require('cartodb.js-v3');
var PaginationModel = require('../../../../views/pagination/model');
var PaginationView = require('../../../../views/pagination/view');


/**
 * Responsible for the datasets paginator
 *  ___________________________________________________________________________
 * |                                                                           |
 * |                                             Page 2 of 42 [1] 2 [3][4][5]  |
 * |___________________________________________________________________________|
 *
 */

module.exports = cdb.core.View.extend({

  className: 'DatasetsPaginator',

  initialize: function() {
    this.routerModel = this.options.routerModel;
    this.collection = this.options.collection;
    this.model = new PaginationModel({
      current_page: this.routerModel.get('page')
    });

    this._initBinds();
    this._initViews();
  },

  render: function() {
    this.clearSubViews();
    this.$el.append(this.paginationView.render().el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('change:current_page', function() {
      this.routerModel.set('page', this.model.get('current_page'));
    }, this);
    this.collection.bind('reset', this._updatePaginationModelByCollection, this);
    this.routerModel.bind('change:page', this._updatePaginationModelByRouterModel, this);

    this.add_related_model(this.routerModel);
    this.add_related_model(this.collection);
    this.add_related_model(this.model);
  },

  _initViews: function() {
    this.paginationView = new PaginationView({
      model: this.model
    });
    this.addView(this.paginationView);
  },

  _updatePaginationModelByCollection: function() {
    this.model.set({
      per_page:    this.collection.options.get('per_page'),
      total_count: this.collection.total_entries
    });
  },

  _updatePaginationModelByRouterModel: function() {
    this.model.set('current_page', this.routerModel.get('page'));
  }

});
