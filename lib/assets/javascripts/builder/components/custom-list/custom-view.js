var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListCollection = require('./custom-list-collection');
var SearchView = require('./custom-list-search-view');
var CustomListView = require('./custom-list-view');
var headerTemplate = require('./custom-list-header.tpl');
var CustomListAction = require('./custom-list-action-view');
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
  module: 'components:custom-list:custom-view',

  options: {
    showSearch: true,
    allowFreeTextInput: false,
    typeLabel: 'column',
    itemTemplate: itemTemplate,
    itemView: CustomListItemView
  },

  className: 'CDB-Box-modal CustomList',
  tagName: 'div',

  events: {
    'mouseover': '_onMouseOver',
    'mouseout': '_onMouseOut'
  },

  initialize: function (opts) {
    if (!opts.collection) {
      if (!opts.options) { throw new Error('options array {value, label} is required'); }
      this.collection = new CustomListCollection(opts.options);
    }

    if (opts.position) {
      this.$el.css(opts.position);
    }

    this.options = _.extend({}, this.options, opts);
    this._selectModel = this.options.selectModel;

    if (this.options.mouseOverAction) {
      this._mouseOverAction = this.options.mouseOverAction;
    }

    if (this.options.mouseOutAction) {
      this._mouseOutAction = this.options.mouseOutAction;
    }

    this.model = new Backbone.Model({
      query: '',
      visible: false
    });
    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    if (this.options.showSearch || this.options.actions) {
      this._renderHeader();
    }

    if (this.options.showSearch) {
      this._renderSearch();
    }

    if (this.options.actions) {
      this._renderActions();
    }

    this._renderList();

    if (this.options.showSearch) {
      this._focusSearch();
    }
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:visible', this._onVisibleChanged, this);
    this.model.bind('change:query', this._setActionsVisibility, this);
  },

  _renderHeader: function () {
    this.$el.prepend(headerTemplate());
  },

  _renderSearch: function () {
    this._searchView = new SearchView({
      template: this.options.searchTemplate,
      typeLabel: this.options.typeLabel,
      searchPlaceholder: this.options.searchPlaceholder,
      model: this.model
    });
    this.$('.js-header').prepend(this._searchView.render().el);
    this.addView(this._searchView);
  },

  _renderActions: function () {
    _.each(this.options.actions, function (action) {
      var view = new CustomListAction(action);
      this.$('.js-actions').append(view.render().el);
      this.addView(view);
    }, this);
  },

  _setActionsVisibility: function () {
    this.$('.js-actions').toggleClass('u-hide', this.model.get('query') !== '');
  },

  _focusSearch: function () {
    setTimeout(function () {
      if (this._searchView) {
        this._searchView.focus();
        var input = this._searchView.$('input');
        var $initialVal = input.val();
        input.val($initialVal + ' ');
        input.val($initialVal);
      }
    }.bind(this), 0);
  },

  _renderList: function () {
    this._listView = new CustomListView({
      model: this.model,
      allowFreeTextInput: this.options.allowFreeTextInput,
      collection: this.collection,
      typeLabel: this.options.typeLabel,
      itemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate,
      size: this.options.size,
      mouseOverAction: this._mouseOverAction,
      mouseOutAction: this._mouseOutAction
    });
    this.$el.append(this._listView.render().el);

    this._listView.highlight();
    this.addView(this._listView);

    this._listView.bind('customEvent', function (eventName, item) {
      this.trigger(eventName, item, this);
    }, this);
  },

  highlight: function () {
    this._listView.highlight();
  },

  _onVisibleChanged: function (_model, isVisible) {
    this._resetQuery();
    this._toggleVisibility();

    isVisible ? this.render() : this.clearSubViews();
  },

  _resetQuery: function () {
    var query = this._selectModel && this._selectModel.get(this.options.typeLabel) || '';
    this.model.set('query', query);

    var isInCollection = this.collection.findWhere({ val: query });
    if (query && !isInCollection) {
      this.collection.add({ label: query, val: query });
    }
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
  },

  _onMouseOver: function () {
    this._mouseOverAction && this._mouseOverAction();
  },

  _onMouseOut: function () {
    this._mouseOutAction && this._mouseOutAction();
  },

  remove: function () {
    this._listView && this._listView.clean();
    CoreView.prototype.remove.call(this);
  }
});
