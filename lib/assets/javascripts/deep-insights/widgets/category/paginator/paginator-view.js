var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var defaultTemplate = require('./paginator-template.tpl');
var paginationTemplate = require('./pagination-template.tpl');

var MIN_CATEGORIES = 5;
var STARTING_PAGE = 1;
var PAGINATION_STEP = 1;

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
    'click .js-next': '_onNextPage',
    'click .js-prev': '_onPrevPage'
  },

  initialize: function () {
    this.dataviewModel = this.options.dataviewModel;
    this.widgetModel = this.options.widgetModel;
    this._$target = this.options.$target;
    this.model = new cdb.core.Model({
      page: STARTING_PAGE
    });
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    this._scrollToPage();

    return this;
  },

  _initBinds: function () {
    $(window).bind('resize.' + this.cid, _.bind(this._scrollToPage, this));

    this.listenTo(this.model, 'change:page', this.render);

    this.listenTo(this.dataviewModel, 'change:categoriesCount', this.render);
    this.listenTo(this.dataviewModel, 'change:data change:searchData', this._onDataChanged);

    this.listenTo(this.widgetModel, 'change:search', this.toggle);
  },

  _initViews: function () {
    var categoriesCount = this.dataviewModel.getCount();

    if (categoriesCount > MIN_CATEGORIES) {
      var template = this.options.template;

      this.$el.html(template({
        categoriesCount: categoriesCount
      }));

      if (this.options.paginator) {
        this.$el.append(paginationTemplate({
          currentPage: this.model.get('page'),
          pages: this._totalPages()
        }));
      }
    } else {
      this.model.set('page', STARTING_PAGE);
    }
  },

  // If current page doesn't exist due to a data change, we should reset it
  _setPage: function () {
    var pages = this._totalPages();

    if (this.model.get('page') > pages || this.model.get('page') < STARTING_PAGE) {
      this.model.set({ page: STARTING_PAGE }, { silent: true });
    }
  },

  _onSearchClicked: function () {
    this.widgetModel.setupSearch();
  },

  _onDataChanged: function () {
    this._setPage();
    this.render();
  },

  _scrollToPage: function () {
    var page = this.model.get('page');
    var pageWidth = this._$target.find('.CDB-Widget-listGroup').first().outerWidth();
    var currentPageIndex = page - 1; // Transform from 1-based index to zero-based index

    this._$target.css('margin-left', -(currentPageIndex * pageWidth));
  },

  _onPrevPage: function () {
    this._changePage(PAGINATION_STEP);
  },

  _onNextPage: function () {
    this._changePage(-PAGINATION_STEP);
  },

  _changePage: function (step) {
    var totalPages = this._totalPages();
    var currentPage = this.model.get('page');
    var nextPage = currentPage + step;

    if (nextPage > totalPages) {
      nextPage = STARTING_PAGE;
    }

    if (nextPage < STARTING_PAGE) {
      nextPage = totalPages;
    }

    this.model.set('page', nextPage);
  },

  _totalPages: function () {
    return Math.ceil(this.dataviewModel.getSize() / this.options.itemsPerPage);
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
