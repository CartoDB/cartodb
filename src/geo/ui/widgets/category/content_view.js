/**
 *
 *
 *
 */

cdb.geo.ui.Widget.Category.Content = cdb.geo.ui.Widget.Content.extend({

  _ITEMS_PER_PAGE: 6,

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>'+
      '</div>'+
      '<dl class="Widget-info Widget-textSmaller Widget-textSmaller--upper">'+
        '<dt class="Widget-infoItem">- null rows</dt>'+
        '<dt class="Widget-infoItem">- min</dt>'+
        '<dt class="Widget-infoItem">- avg</dt>'+
        '<dt class="Widget-infoItem">- max</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content Widget-content--noSidesMargin">'+
      '<div class="Widget-listWrapper js-content"></div>'+
    '</div>'+
    '<div class="Widget-footer js-footer"></div>',

  render: function() {
    this.clearSubViews();
    var template = _.template(this._TEMPLATE);
    this.$el.html(
      template({
        title: this.model.get('title')
      })
    );
    this._initViews();
    return this;
  },

  // Reset category content bindings and move that logic to category list view
  _initBinds: function() {},

  _initViews: function() {
    // List view -> items view
    var list = new cdb.geo.ui.Widget.Category.ItemsView({
      model: this.model,
      filter: this.filter,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').html(list.render().el);
    this.addView(list);

    // Paginator
    var pagination = new cdb.geo.ui.Widget.Category.PaginatorView({
      $target: list.$el,
      viewModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-footer').append(pagination.render().el);
    this.addView(pagination);
  }

});
