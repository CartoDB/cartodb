var cdb = require('cartodb.js');
var CustomListCollection = require('./custom-list-collection');
var SearchView = require('./custom-list-search-view');
var CustomListView = require('./custom-list-view');
var itemTemplate = require('./custom-list-item.tpl');
var CustomListItemView = require('./custom-list-item-view');

/*
 *  A custom list with possibility to search within values.
 *
 *  It accepts a collection of (val, label) model attributes or a values array
 *  with the same content or only strings.
 *
 *  new CustomList({
 *    showSearch: false,
 *    itemTemplate
 *    values: [
 *      {
 *        val: 'hello',
 *        label: 'hi'
 *      }
 *    ]
 *  });
 */

module.exports = cdb.core.View.extend({

  options: {
    showSearch: true,
    typeLabel: 'column',
    itemTemplate: itemTemplate,
    itemView: CustomListItemView
  },

  className: 'CDB-Box-Modal CDB-SelectItem CustomList',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new CustomListCollection(opts.options);
    }
    this.model = new cdb.core.Model({
      query: '',
      visible: false
    });
    this.template = this.options.template;
    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    if (this.options.showSearch) {
      this._renderSearch();
    }
    this._renderList();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:visible', function (mdl, isVisible) {
      this._resetQuery();
      this._toggleVisibility();

      if (!isVisible) {
        this.clearSubViews();
      } else {
        this.render();
      }
    }, this);
  },

  _renderSearch: function () {
    var searchView = new SearchView({
      typeLabel: this.options.typeLabel,
      model: this.model
    });
    this.$el.prepend(searchView.render().el);
    this.addView(searchView);
  },

  _renderList: function () {
    var listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      typeLabel: this.options.typeLabel,
      ItemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate
    });
    this.$el.append(listView.render().el);
    this.addView(listView);
  },

  _resetQuery: function () {
    this.model.set('query', '');
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  }

});
