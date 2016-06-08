var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampList = require('./ramps');

module.exports = CoreView.extend({
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
    var ramps = _.map(rampList, function (rampItem, name) {
      var ramp = rampItem[this._bins];
      return {
        selected: (ramp === this.model.get('range')),
        name: name,
        val: ramp
      };
    }, this);

    this.collection = new CustomListCollection(ramps);
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    // 'manually' selecte the item to preserve scroll position
    var range = item.get('val');
    this.$('.js-listItemLink').removeClass('is-selected');
    this.$('.js-listItem[data-val="' + range.join(',') + '"] .js-listItemLink').addClass('is-selected');

    this.trigger('selectItem', range, this);
  }
});
