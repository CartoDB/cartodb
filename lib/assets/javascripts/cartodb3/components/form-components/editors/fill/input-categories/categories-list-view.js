var _ = require('underscore');
var cdb = require('cartodb.js');
var CustomListView = require('../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../custom-list/custom-list-collection');
var template = require('./categories-list-view.tpl');
var itemTemplate = require('./categories-list-item.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.categories) throw new Error('categories param is required');

    this._categories = opts.categories;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._setupCollection();

    this._initBinds();

    this._listView = new CustomListView({
      itemTemplate: itemTemplate,
      collection: this._collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel
    });
  },

  render: function () {
    this.$el.append(template({
      categories: this._collection.models
    }));

    this.$('.js-content').append(this._listView.render().$el);

    return this;
  },

  _setupCollection: function () {
    var categories = _.map(this._categories, function (category) {
      return { label: category.title, val: category.color };
    }, this);

    this._collection = new CustomListCollection(categories);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this._collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item, this);
  }
});
