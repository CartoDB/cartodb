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
    allowFreeTextInput: false,
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

    if (opts.position) {
      this.$el.css(opts.position);
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
    this._setListMaxSize();

    if (this.options.showSearch) {
      this._focusSearch();
    }
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
    this._searchView = new SearchView({
      typeLabel: this.options.typeLabel,
      model: this.model
    });
    this.$el.prepend(this._searchView.render().el);
    this.addView(this._searchView);
  },

  _focusSearch: function () {
    setTimeout(function () {
      this._searchView && this._searchView.focus();
    }.bind(this), 0);
  },

  _renderList: function () {
    this._listView = new CustomListView({
      model: this.model,
      allowFreeTextInput: this.options.allowFreeTextInput,
      collection: this.collection,
      typeLabel: this.options.typeLabel,
      ItemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate,
      size: this.options.size,
      iconStylingEnabled: this.options.iconStylingEnabled
    });
    this.$el.append(this._listView.render().el);
    this._listView.highlight();
    this.addView(this._listView);

    this._listView.bind('customEvent', function (eventName, item) {
      this.trigger(eventName, item, this);
    }, this);
  },

  _setListMaxSize: function () {
    setTimeout(function () {
      this._listView && this._listView.setMaxSize();
      this.$el.addClass('has-visibility');
    }.bind(this), 0);
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
    this.$el.removeClass('has-visibility');
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
