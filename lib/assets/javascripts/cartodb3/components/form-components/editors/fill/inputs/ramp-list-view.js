var _ = require('underscore');
var cdb = require('cartodb.js');
var CustomListView = require('../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./ramp-list-item-template.tpl');
var rampList = require('./ramps');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.buckets) throw new Error('buckets is required');

    this._buckets = opts.buckets;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    var ramps = _.map(rampList, function (ramp) {
      return { name: 'test', val: ramp[this._buckets] };
    }, this);

    this.collection = new CustomListCollection(ramps);
    console.log(this.collection.models[0].attributes);

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

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item.get('val'), this);
  }
});
