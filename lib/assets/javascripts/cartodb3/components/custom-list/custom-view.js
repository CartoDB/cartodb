var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
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
 *    itemTemplate: itemTemplate,
 *    values: [
 *      {
 *        val: 'hello',
 *        label: 'hi'
 *      }
 *    ]
 *  });
 */

module.exports = CoreView.extend({

  options: {
    showSearch: true,
    typeLabel: 'column',
    itemTemplate: itemTemplate,
    itemView: CustomListItemView
  },

  className: 'CDB-Box-modal CustomList',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new CustomListCollection(opts.options);
    }

    this.options = _.extend({}, this.options, opts);
    this.model = new Backbone.Model({
      query: '',
      visible: false
    });
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
    searchView.focus();
  },

  _renderList: function () {
    this._listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      typeLabel: this.options.typeLabel,
      ItemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate
    });
    this.$el.append(this._listView.render().el);
    this._listView.highlight();
    this.addView(this._listView);
  },

  highlight: function () {
    this._listView.highlight();
  },

  _resetQuery: function () {
    this.model.set('query', '');
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.trigger('hidden', this);
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
