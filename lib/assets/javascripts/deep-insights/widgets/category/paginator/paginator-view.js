var $ = require('jquery');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var defaultTemplate = require('./paginator-template.tpl');
var paginationTemplate = require('./pagination-template.tpl');

var MIN_CATEGORIES = 5;
var STARTING_PAGE = 1;
var PAGINATION_STEP = 1;

var REQUIRED_OPTS = [
  'dataviewModel',
  'widgetModel',
  'paginatorModel'
];

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

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._paginatorModel, 'change:page', this.render);

    this.listenTo(this._dataviewModel, 'change:categoriesCount', this.render);
    this.listenTo(this._dataviewModel, 'change:data change:searchData', this._onDataChanged);

    this.listenTo(this._widgetModel, 'change:search', this.toggle);
  },

  _initViews: function () {
    var categoriesCount = this._dataviewModel.getCount();

    if (categoriesCount > MIN_CATEGORIES) {
      var template = this.options.template;

      this.$el.html(template({
        categoriesCount: categoriesCount
      }));

      if (this.options.paginator) {
        this.$el.append(paginationTemplate({
          currentPage: this._paginatorModel.get('page'),
          pages: this._totalPages()
        }));
      }
    } else {
      this._paginatorModel.set('page', STARTING_PAGE);
    }
  },

  // If current page doesn't exist due to a data change, we should reset it
  _setPage: function () {
    var pages = this._totalPages();

    if (this._paginatorModel.get('page') > pages || this._paginatorModel.get('page') < STARTING_PAGE) {
      this._paginatorModel.set({ page: STARTING_PAGE }, { silent: true });
    }
  },

  _onSearchClicked: function () {
    this._widgetModel.setupSearch();
  },

  _onDataChanged: function () {
    this._setPage();
    this.render();
  },

  _onPrevPage: function () {
    this._changePage(-PAGINATION_STEP);
  },

  _onNextPage: function () {
    this._changePage(PAGINATION_STEP);
  },

  _changePage: function (step) {
    var totalPages = this._totalPages();
    var currentPage = this._paginatorModel.get('page');
    var nextPage = currentPage + step;

    if (nextPage > totalPages) {
      nextPage = STARTING_PAGE;
    }

    if (nextPage < STARTING_PAGE) {
      nextPage = totalPages;
    }

    this._paginatorModel.set('page', nextPage);
  },

  _totalPages: function () {
    return Math.ceil(this._dataviewModel.getSize() / this.options.itemsPerPage);
  },

  toggle: function () {
    this[ this._widgetModel.isSearchEnabled() ? 'hide' : 'show' ]();
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
