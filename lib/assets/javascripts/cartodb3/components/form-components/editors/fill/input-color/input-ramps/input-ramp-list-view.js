var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampList = require('./ramps');

module.exports = CoreView.extend({
  initialize: function (opts) {
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
    this._selectRamp(this.collection.getSelectedItem());
    return this;
  },

  _setupCollection: function () {
    var ramps = _.map(rampList, function (rampItem, name) {
      var ramp = rampItem[this.model.get('bins')];
      var isSelected = false;

      if (ramp && this.model.get('range')) {
        isSelected = ramp.join() === this.model.get('range').join();
      }

      return {
        selected: isSelected,
        name: name,
        val: ramp
      };
    }, this);

    this.collection = new CustomListCollection(ramps);
  },

  _initBinds: function () {
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _selectRamp: function (item) {
    if (!item) {
      return;
    }

    var range = item.get('val');
    // 'manually' select the item to preserve scroll position
    this.$('.js-listItemLink').removeClass('is-selected');
    this.$('.js-listItem[data-val="' + range.join(',') + '"] .js-listItemLink').addClass('is-selected');
  },

  _onSelectItem: function (item) {
    this._selectRamp(item);
    this.trigger('selectItem', item.get('val'), this);
  }
});
