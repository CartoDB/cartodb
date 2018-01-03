var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var defaultTemplate = require('./paginator-template.tpl');
var MINCATEGORIES = 5;

/**
 *  Display paginator for category widget
 *
 */

module.exports = CoreView.extend({
  options: {
    itemsPerPage: 6,
    template: defaultTemplate,
    paginator: false
  },

  className: 'CDB-Widget-nav CDB-Widget-contentSpaced',

  events: {
    'click .js-searchToggle': '_onSearchClicked',
    'click .js-page': '_onDotClick'
  },

  initialize: function () {
    this.dataviewModel = this.options.dataviewModel;
    this.widgetModel = this.options.widgetModel;
    this._$target = this.options.$target;
    this.model = new cdb.core.Model({
      page: 0
    });
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var categoriesCount = this.dataviewModel.getCount();
    var isMobile = 'ontouchstart' in window;

    if (categoriesCount > MINCATEGORIES) {
      var pages = Math.ceil(this.dataviewModel.getSize() / this.options.itemsPerPage);
      var template = this.options.template;
      this.$el.html(
        template({
          showSearch: !isMobile,
          showPaginator: this.options.paginator,
          currentPage: this.model.get('page'),
          categoriesCount: categoriesCount,
          pages: pages
        })
      );
    } else {
      this.model.set('page', 0);
    }
    this._scrollToPage();

    return this;
  },

  _initBinds: function () {
    $(window).bind('resize.' + this.cid, _.bind(this._scrollToPage, this));
    this.model.bind('change:page', this.render, this);
    this.dataviewModel.bind('change:categoriesCount', this.render, this);
    this.dataviewModel.bind('change:data change:searchData', function () {
      this._setPage();
      this.render();
    }, this);
    this.widgetModel.bind('change:search', this.toggle, this);
    this.add_related_model(this.dataviewModel);
    this.add_related_model(this.widgetModel);
  },

  // If current page doesn't exist due to a data change, we should reset it
  _setPage: function () {
    var count = this.dataviewModel.getSize();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    if (this.model.get('page') > (pages - 1)) {
      this.model.set({ page: 0 }, { silent: true });
    }
  },

  _onSearchClicked: function () {
    this.widgetModel.setupSearch();
  },

  _scrollToPage: function () {
    var page = this.model.get('page');
    var pageWidth = this._$target.find('.CDB-Widget-listGroup').first().outerWidth();
    this._$target.css('margin-left', -(page * pageWidth));
  },

  _onDotClick: function (ev) {
    var page = $(ev.target).data('page');
    this.model.set('page', page);
  },

  toggle: function () {
    this[ this.widgetModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  clean: function () {
    $(window).unbind('resize.' + this.cid);
    CoreView.prototype.clean.call(this);
  }

});
