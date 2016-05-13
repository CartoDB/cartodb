var _ = require('underscore');
var cdb = require('cartodb.js');
var CustomListView = require('../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampList = require('./ramps');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.bins) throw new Error('bins is required');

    this._bins = opts.bins;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._setupCollection();
    this._initBinds();

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      itemTemplate: rampItemTemplate
    });
  },

  render: function () {
    this.$el.append(this._listView.render().$el);
    return this;
  },

  _setupCollection: function () {
    var ramps = _.map(rampList, function (ramp, name) {
      return { name: name, val: ramp[this._bins] };
    }, this);

    this.collection = new CustomListCollection(ramps);
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item.get('val'), this);
  }
});
