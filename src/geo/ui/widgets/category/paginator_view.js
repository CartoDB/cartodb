var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var Model = require('cdb/core/model');

module.exports = View.extend({

  _ITEMS_PER_PAGE: 6,

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
    this._ITEMS_PER_PAGE = this.options.itemsPerPage;
    this.dataModel = this.options.dataModel;
    this._$target = this.options.$target;
    this.model = new Model({
      page: 0
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var count = this.dataModel.getSize();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    var template = _.template(this._TEMPLATE);
    this.$el.html(
      template({
        currentPage: this.model.get('page'),
        categoriesCount: count || '-',
        pages: pages
      })
    );
    this._scrollToPage();

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_scrollToPage');
    $(window).bind('resize', this._scrollToPage);
    this.model.bind('change:page', this.render, this);
    this.dataModel.bind('change:data', function() {
      this._setPage();
      this.render();
    }, this);
    this.add_related_model(this.dataModel);
  },

  // If current page doesn't exist due to a data change, we should reset it
  _setPage: function() {
    var count = this.dataModel.getSize();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    if (this.model.get('page') > (pages - 1)) {
      this.model.set({ page: 0 }, { silent :true });
    }
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
    View.prototype.clean.call(this);
  }

});
