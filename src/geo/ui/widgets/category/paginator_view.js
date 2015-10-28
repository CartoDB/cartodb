/**
 *
 *
 *
 */

cdb.geo.ui.Widget.Category.PaginatorView = cdb.core.View.extend({

  _ITEMS_PER_PAGE: 4,

  className: 'Widget-nav Widget-contentSpaced',

  _TEMPLATE: ' ' +
      '<p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmall--upper"><%- categoriesCount %> categor<%- categoriesCount !== 1 ? "ies" : "y" %></p>' +
      '<div class="Widget-navDots js-dots">'+
        '<% for (var i = 0, l = pages; i < l; i++) { %>' +
          '<button class="Widget-dot Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button>' +
        '<% } %>' +
      '</div>',

  events: {
    'click .js-page': '_onDotClick'
  },

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this._$target = this.options.$target;
    this.model = new cdb.core.Model({
      pages: this.options.pages,
      page: 0,
      itemsPerPage: this.options.itemsPerPage
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var template = _.template(this._TEMPLATE);
    var categoriesCount = this.dataModel.getSize();
    this.$el.html(
      template({
        currentPage: this.model.get('page'),
        categoriesCount: categoriesCount || '-',
        pages: this.model.get('pages')
      })
    );
    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_scrollToPage');
    $(window).bind('resize', this._scrollToPage);
    this.model.bind('change:page', function() {
      this.render();
      this._scrollToPage();
    }, this);
    this.dataModel.bind('change:data', this.render, this);
    this.add_related_model(this.dataModel);
  },

  _scrollToPage: function() {
    var page = this.model.get('page');
    var pageWidth = this._$target.find('.Widget-listGroup:eq(0)').outerWidth();
    this._$target.css('margin-left', - (page * pageWidth));
  },

  _onDotClick: function(ev) {
    var page = $(ev.target).data('page');
    this.model.set('page', page);
  },

  clean: function() {
    $(window).unbind('resize', this._scrollToPage);
    cdb.core.View.prototype.clean.call(this);
  }

});
