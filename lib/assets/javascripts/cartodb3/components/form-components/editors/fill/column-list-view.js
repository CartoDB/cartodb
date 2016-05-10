var cdb = require('cartodb.js');
var CustomListView = require('../../../custom-list/custom-view');
var CustomListCollection = require('../../../custom-list/custom-list-collection');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.columns) throw new Error('columns param is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._columns = opts.columns;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this.collection = new CustomListCollection(this._columns);

    this._initBinds();

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel
    });
  },

  render: function () {
    this.$el.append(this._listView.render().$el);
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item.get('val'), this);
  }
});
