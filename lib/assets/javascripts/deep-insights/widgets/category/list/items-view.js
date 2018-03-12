var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var CategoryItemView = require('./item/item-view');
var placeholder = require('./items-placeholder-template.tpl');

var REQUIRED_OPTS = [
  'dataviewModel',
  'widgetModel',
  'paginatorModel'
];

/**
 * Category list view
 */
module.exports = CoreView.extend({
  options: {
    paginator: false,
    itemsPerPage: 6
  },

  className: 'CDB-Widget-list js-list',

  tagName: 'ul',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (!this._dataviewModel.get('sync_on_bbox_change')) {
      this.$el.addClass('CDB-Widget-list--nodynamic');
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var data = this._dataviewModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._paginatorModel, 'change:page', this.render);

    this.listenTo(this._widgetModel, 'change:search', this.toggle);
    this.listenTo(this._widgetModel, 'change:style change:autoStyle', this.render);

    this.listenTo(this._dataviewModel, 'change:data', this.render);
    this.listenTo(this._dataviewModel, 'change:sync_on_bbox_change', this.blockFiltering);
  },

  _renderPlaceholder: function () {
    // Change view classes
    this.$el.addClass('CDB-Widget-list--withBorders CDB-Widget-list--fake');
    this.$el.append(placeholder());
  },

  _renderList: function () {
    this._createList();

    this.$el.removeClass('CDB-Widget-list--withBorders CDB-Widget-list--fake CDB-Widget-list--noresults');

    this._renderItems();
  },

  _renderItems: function () {
    var currentPage = this._paginatorModel.get('page');
    var pageIndex = currentPage - 1; // Transform from 1-based index to zero-based index
    var items = this.pagesData[pageIndex];

    _.each(items, function (model) {
      this._addItem(model);
    }.bind(this));
  },

  _createList: function () {
    this.pagesData = {};

    var data = this._getData();
    var currentIndex = 0;

    data.each(function (model, index) {
      if (index % this.options.itemsPerPage === 0) {
        if (index !== 0) {
          currentIndex += 1;
        }
        this.pagesData[currentIndex] = [];
      }

      this.pagesData[currentIndex].push(model);
    }, this);
  },

  _getData: function () {
    return this._dataviewModel.getData();
  },

  _addItem: function (model) {
    var view = new CategoryItemView({
      model: model,
      widgetModel: this._widgetModel,
      dataviewModel: this._dataviewModel
    });

    view.bind('itemClicked', this._setFilters, this);

    this.addView(view);
    this.$el.append(view.render().el);
  },

  _setFilters: function (mdl) {
    var isSelected = mdl.get('selected');
    var filter = this._dataviewModel.filter;
    var clickedName = mdl.get('name');

    if (isSelected) {
      // If there isn't any filter applied,
      // clicking over one will turn rest into as "unselected"
      if (filter.rejectedCategories.size() === 0 &&
          filter.acceptedCategories.size() === 0
      ) {
        var data = this._dataviewModel.getData();
        // Make elements "unselected"
        data.each(function (m) {
          var name = m.get('name');
          if (name !== clickedName) {
            m.set('selected', false);
          }
        });
        filter.accept(mdl.get('name'));
      } else {
        mdl.set('selected', false);
        filter.reject(clickedName);
      }
    } else {
      mdl.set('selected', true);
      filter.accept(clickedName);
    }
    this._widgetModel.set('acceptedCategories', this._widgetModel._acceptedCategories().pluck('name'));
  },

  blockFiltering: function (e) {
    if (e.changed['sync_on_bbox_change']) { // Is dynamic
      this.$el.removeClass('CDB-Widget-list--nodynamic');
    } else { // It is not
      this.$el.addClass('CDB-Widget-list--nodynamic');
      this._dataviewModel.filter.acceptAll();
    }
  },

  removeSelections: function () {
    this._dataviewModel.filter.acceptAll();
  },

  toggle: function () {
    this[!this._widgetModel.isSearchEnabled() ? 'show' : 'hide']();
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }

});
