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
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:search', this.toggle, this);
    this.viewModel.bind('change:isColorsApplied', this.render, this);
    this.add_related_model(this.viewModel);

    this.dataModel.bind('change:data change:searchData', this.render, this);
    this.add_related_model(this.dataModel);
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
    var data = this.dataModel.getData();

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
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
    v.bind('itemClicked', this._setFilters, this);
    this.addView(v);
    $parent.append(v.render().el);
  },

  _setFilters: function (mdl) {
    var isSelected = mdl.get('selected');

    if (isSelected) {
      if (!this.dataModel.getRejectedCount() && !this.dataModel.getAcceptedCount() && this.dataModel.getCount() > 1) {
        var data = this.dataModel.getData();
        // Make elements "unselected"
        data.map(function (m) {
          var name = m.get('name');
          if (name !== mdl.get('name')) {
            m.set('selected', false);
          }
        });
        this.dataModel.acceptFilters(mdl.get('name'));
      } else {
        mdl.set('selected', false);
        this.dataModel.rejectFilters(mdl.get('name'));
      }
    } else {
      mdl.set('selected', true);
      this.dataModel.acceptFilters(mdl.get('name'));
    }
  },

  toggle: function () {
    this[!this.viewModel.isSearchEnabled() ? 'show' : 'hide']();
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }

});
