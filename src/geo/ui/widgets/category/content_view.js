/**
 *
 *
 *
 */

cdb.geo.ui.Widget.Category.Content = cdb.geo.ui.Widget.Content.extend({

  _ITEMS_PER_PAGE: 4,

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
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

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-list Widget-list--withBorders">' +
      '<li class="Widget-listItem Widget-listItem--fake"></li>' +
      '<li class="Widget-listItem Widget-listItem--fake"></li>' +
      '<li class="Widget-listItem Widget-listItem--fake"></li>' +
      '<li class="Widget-listItem Widget-listItem--fake"></li>' +
    '</ul>',

  render: function() {
    this.clearSubViews();

    var template = _.template(this._TEMPLATE);
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.viewModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this._initViews();
    }

    return this;
  },

  _initViews: function() {
    var count = this.dataModel.getSize();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);

    // List view -> items view
    var list = new cdb.geo.ui.Widget.Category.ItemsView({
      viewModel: this.viewModel,
      dataModel: this.dataModel,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').html(list.render().el);
    this.addView(list);

    if (pages > 0) {
      // Paginator
      var pagination = new cdb.geo.ui.Widget.Category.PaginatorView({
        $target: list.$el,
        pages: pages,
        itemsPerPage: this._ITEMS_PER_PAGE
      });
      this.$('.js-footer').append(pagination.render().el);
      this.addView(pagination);
    }
  }

});
