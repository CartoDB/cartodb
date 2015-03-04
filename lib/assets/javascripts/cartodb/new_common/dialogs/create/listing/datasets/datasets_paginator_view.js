var cdb = require('cartodb.js');
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
    var self = this;
    this.routerModel = this.options.routerModel;
    this.model = new PaginationModel({
      current_page: this.routerModel.get('page'),
      url_to:       function(page) { return '' }
    });
    
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.collection.bind('reset', this._updatePaginationModelByCollection, this);
    this.routerModel.bind('change', this._updatePaginationModelByRouter, this);
    this.add_related_model(this.routerModel);
    this.add_related_model(this.collection);
  },

  _initViews: function() {
    this.paginationView = new PaginationView({
      model: this.model
    });
    this.paginationView.bind('pageClicked', function(p) {
      this.routerModel.set('page', p);
    }, this);
    this.paginationView.render();
    this.$el.append(this.paginationView.el);
    this.addView(this.paginationView);
  },

  _updatePaginationModelByCollection: function() {
    this.model.set({
      per_page:    this.collection.options.get('per_page'),
      total_count: this.collection.total_entries
    });
  },

  _updatePaginationModelByRouter: function() {
    this.model.set('current_page', this.routerModel.get('page'));
  }

});