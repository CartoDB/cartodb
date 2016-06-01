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
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._collection = new CustomListCollection();
    this._initBinds();
  },

  render: function () {
    this._setupCollection();
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      range: this.model.get('range'),
      attribute: this.model.get('attribute')
    }));

    this._listView = new CustomListView({
      itemTemplate: itemTemplate,
      collection: this._collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel
    });

    this.addView(this._listView);

    this.$('.js-content').append(this._listView.render().$el);

    return this;
  },

  _setupCollection: function () {
    var categories = _.map(this.model.get('range'), function (color, i) {
      return { label: this.model.get('domain')[i], val: color };
    }, this);
    this._collection.reset(categories);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this.model.on('change:range', this.render, this);
    this.model.on('change:domain', this.render, this);
    this._collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', this._collection.indexOf(item), this);
  }
});
