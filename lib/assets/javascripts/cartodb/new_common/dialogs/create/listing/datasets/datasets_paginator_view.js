var cdb = require('cartodb.js');

/**
 *  Datasets pagination
 *  ___________________________________________________________________________
 * |                                                                           |
 * |                                             Page 2 of 42 [1] 2 [3][4][5]  |
 * |___________________________________________________________________________|
 *
 */

module.exports = cdb.core.View.extend({

  _MAX_PAGES: 4,

  events: {
    'click .Pagination-listItemLink': '_onPageClick'
  },

  initialize: function() {
    this.routerModel = this.options.routerModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/datasets_paginator');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.template({
        page: this.routerModel.get('page'),
        totalEntries: this.collection.total_entries,
        totalPages: Math.floor(this.collection.total_entries/this.collection._TABLES_PER_PAGE),
        pagesCount: this._MAX_PAGES,
        tablesPerPage: this.collection._TABLES_PER_PAGE
      })
    );
    this.show();
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.routerModel);
    this.add_related_model(this.collection);
  },

  _onPageClick: function(ev) {
    var page = parseInt(this.$(ev.target).val());
    if (page !== undefined && page !== this.routerModel.get('page')) {
      this.routerModel.set('page', page);  
    }
  }

});
