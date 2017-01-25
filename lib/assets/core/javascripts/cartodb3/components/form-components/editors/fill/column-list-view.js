var CoreView = require('backbone/core-view');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListCollection = require('../../../custom-list/custom-list-collection');
var template = require('./column-list-view.tpl');

module.exports = CoreView.extend({
  defaults: {
    headerTitle: ''
  },

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.columns) throw new Error('columns param is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._columns = opts.columns;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;
    this._itemTemplate = opts.itemTemplate;

    this.collection = new CustomListCollection(this._columns);

    this._initBinds();

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      itemTemplate: this._itemTemplate
    });
  },

  render: function () {
    this.$el.append(template({
      headerTitle: this.options.headerTitle
    }));

    this.$('.js-content').append(this._listView.render().$el);

    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item, this);
  }
});
