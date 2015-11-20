var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var WidgetCategoryItemView = require('./item_view');
var placeholder = require('./placeholder.tpl');

/**
 * Category list view
 */
module.exports = View.extend({

  options: {
    paginator: false,
    itemsPerPage: 6
  },

  className: 'Widget-list Widget-list--wrapped js-list',
  tagName: 'ul',

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
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

  _initBinds: function() {
    this.model.bind('change:search', this.toggle, this);
    this.dataModel.bind('change:data', this.render, this);
  },

  _renderPlaceholder: function() {
    // Change view classes
    this.$el
      .addClass('Widget-list--withBorders')
      .removeClass('Widget-list--wrapped');
    this.$el.append(placeholder());
  },

  _renderList: function() {
    // Change view classes
    this.$el.removeClass('Widget-list--withBorders');
    this.$el[ this.options.paginator ? 'addClass' : 'removeClass']('Widget-list--wrapped');

    var groupItem;
    var data = this.dataModel.getData();

    data.each(function(mdl, i) {
      if (i % this.options.itemsPerPage === 0) {
        groupItem = $('<div>').addClass('Widget-listGroup');
        this.$el.append(groupItem);
      }
      this._addItem(mdl, groupItem);
    }, this);
  },

  _addItem: function(mdl, $parent) {
    var v = new WidgetCategoryItemView({
      model: mdl,
      dataModel: this.dataModel,
      filter: this.filter
    });
    v.bind('itemClicked', this._setFilters, this);
    this.addView(v);
    $parent.append(v.render().el);
  },

  _setFilters: function(mdl) {
    var isSelected = mdl.get('selected');

    if (isSelected) {
      if (!this.filter.hasRejects() && !this.filter.hasAccepts()) {
        var data = this.dataModel.getData();
        var rejects = [];
        // Make elements "unselected"
        data.map(function(m) {
          var name = m.get('name');
          if (name !== mdl.get('name')) {
            m.set('selected', false);
          }
        });
        this.filter.accept(mdl.get('name'));
      } else {
        mdl.set('selected', false);
        this.filter.reject(mdl.get('name'));
      }
    } else {
      mdl.set('selected', true);
      this.filter.accept(mdl.get('name'));
    }
  },

  toggle: function() {
    this[ !this.model.isSearchEnabled() ? 'show' : 'hide']();
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
