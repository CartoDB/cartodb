var cdb = require('cartodb.js');
var PaginationModel = require('../../../../pagination/pagination-model');
var PaginationView = require('../../../../pagination/pagination-view');

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

  initialize: function (opts) {
    if (!opts.routerModel) throw new TypeError('routerModel is required');
    if (!opts.tablesCollection) throw new TypeError('tablesCollection is required');

    this._routerModel = opts.routerModel;
    this._tablesCollection = opts.tablesCollection;

    this.model = new PaginationModel({
      current_page: this._routerModel.get('page')
    });

    this._initBinds();
    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.append(this.paginationView.render().el);
    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
    this.model.bind('change:current_page', function () {
      this._routerModel.set('page', this.model.get('current_page'));
    }, this);
    this._tablesCollection.bind('sync', this._updatePaginationModelByCollection, this);
    this._routerModel.bind('change:page', this._updatePaginationModelByRouterModel, this);

    this.add_related_model(this._routerModel);
    this.add_related_model(this._tablesCollection);
    this.add_related_model(this.model);
  },

  _initViews: function () {
    this.paginationView = new PaginationView({
      model: this.model
    });
    this.addView(this.paginationView);
  },

  _updatePaginationModelByCollection: function () {
    this.model.set({
      per_page: this._tablesCollection.getDefaultParam('per_page'),
      total_count: this._tablesCollection.getTotalStat('total_entries')
    });
  },

  _updatePaginationModelByRouterModel: function () {
    this.model.set('current_page', this._routerModel.get('page'));
  }

});
