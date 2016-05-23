var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var CategoryItemView = require('./item/item-view');
var placeholder = require('./items-placeholder-template.tpl');

/**
 * Category list view
 */
module.exports = cdb.core.View.extend({
  options: {
    paginator: false,
    itemsPerPage: 6
  },

  className: 'CDB-Widget-list CDB-Widget-list--wrapped js-list',
  tagName: 'ul',

  initialize: function () {
    this.widgetModel = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var data = this.dataviewModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:search', this.toggle, this);
    this.widgetModel.bind('change:autoStyle', this.render, this);
    this.add_related_model(this.widgetModel);

    this.dataviewModel.bind('change:data', this.render, this);
    this.add_related_model(this.dataviewModel);
  },

  _renderPlaceholder: function () {
    // Change view classes
    this.$el
      .addClass('CDB-Widget-list--withBorders')
      .removeClass('CDB-Widget-list--wrapped');
    this.$el.append(placeholder());
  },

  _renderList: function () {
    // Change view classes
    this.$el.removeClass('CDB-Widget-list--withBorders');
    this.$el[this.options.paginator ? 'addClass' : 'removeClass']('CDB-Widget-list--wrapped');

    var groupItem;
    var data = this.dataviewModel.getData();

    data.each(function (mdl, i) {
      if (i % this.options.itemsPerPage === 0) {
        groupItem = $('<div>').addClass('CDB-Widget-listGroup');
        this.$el.append(groupItem);
      }
      this._addItem(mdl, groupItem);
    }, this);
  },

  _addItem: function (mdl, $parent) {
    var v = new CategoryItemView({
      model: mdl,
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
    v.bind('itemClicked', this._setFilters, this);
    this.addView(v);
    $parent.append(v.render().el);
  },

  _setFilters: function (mdl) {
    var isSelected = mdl.get('selected');
    var filter = this.dataviewModel.filter;
    var clickedName = mdl.get('name');

    if (isSelected) {
      // If there isn't any filter applied,
      // clicking over one will turn rest into as "unselected"
      if (filter.rejectedCategories.size() === 0 &&
          filter.acceptedCategories.size() === 0
      ) {
        var data = this.dataviewModel.getData();
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
    this.widgetModel.set('acceptedCategories', this.widgetModel._acceptedCategories().pluck('name'));
  },

  toggle: function () {
    this[!this.widgetModel.isSearchEnabled() ? 'show' : 'hide']();
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }

});
