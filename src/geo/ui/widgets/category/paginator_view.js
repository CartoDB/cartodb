var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var Model = require('cdb/core/model');
var defaultTemplate = require('./paginator_template.tpl');

module.exports = View.extend({

  options: {
    itemsPerPage: 6,
    template: defaultTemplate,
    paginator: false
  },

  className: 'Widget-nav Widget-contentSpaced',

  events: {
    'click .js-searchToggle': '_onSearchClicked',
    'click .js-page': '_onDotClick'
  },

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._$target = this.options.$target;
    this.model = new Model({
      page: 0
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var pages = Math.ceil(this.dataModel.getSize() / this.options.itemsPerPage);
    var template = this.options.template;
    this.$el.html(
      template({
        showPaginator: this.options.paginator,
        currentPage: this.model.get('page'),
        pages: pages
      })
    );
    this._scrollToPage();

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_scrollToPage');
    $(window).bind('resize.' + this.cid, _.bind(this._scrollToPage, this));
    this.model.bind('change:page', this.render, this);
    this.dataModel.bind('change:data', function() {
      this._setPage();
      this.render();
    }, this);
    this.viewModel.bind('change:search', this.toggle, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  // If current page doesn't exist due to a data change, we should reset it
  _setPage: function() {
    var count = this.dataModel.getSize();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    if (this.model.get('page') > (pages - 1)) {
      this.model.set({ page: 0 }, { silent :true });
    }
  },

  _onSearchClicked: function() {
    this.dataModel.setupSearch();
    this.viewModel.toggleSearch();
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

  toggle: function() {
    this[ this.viewModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  clean: function() {
    $(window).unbind('resize.' + this.cid);
    View.prototype.clean.call(this);
  }

});
