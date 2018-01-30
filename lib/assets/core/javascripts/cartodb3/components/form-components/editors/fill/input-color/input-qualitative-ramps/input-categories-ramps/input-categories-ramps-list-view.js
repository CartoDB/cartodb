var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');

var CustomRampTemplate = require('./custom-ramp-template.tpl');
var InputCategoryRampsListItemTemplate = ('./input-categories-ramps-list-item.tpl');
var InputCategoryRampsListItemView = ('./input-categories-ramps-list-item-view');

var CustomListView = require('../../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../../custom-list/custom-list-collection');

var CartoColor = require('../../../../../../../helpers/carto-color');

var EVENTS = {
  CUSTOM_COLOR: 'custom-color'
};

module.exports = CoreView.extend({
  events: {},

  initialize: function (options) {
    this.model = options.model;
    this._maxValues = options.maxValues;

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var customRamp = this._customRamp.get('range');

    this.$('.js-customList').prepend(CustomRampTemplate({
      customRamp: customRamp
    }));

    if (customRamp) {
      this.$('.js-customList').addClass('is-customized');
    } else {
      var selectedRamp = this.collection.getSelectedItem();

      if (!selectedRamp) {
        selectedRamp = this.collection.first();
      }

      this._selectRamp(selectedRamp);
    }

    return this;
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

  _initModels: function () {
    this._customRamp = new cdb.core.Model();
    this._setupCollection();
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'change:selected', this._onSelectItem);
  },

  _initViews: function () {
    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      itemTemplate: InputCategoryRampsListItemTemplate,
      itemView: InputCategoryRampsListItemView
    });

    this._listView.bind('customize', function (ramp) {
      this.trigger('customize', ramp, this);
    }, this);

    this.$('.js-content').append(this._listView.render().el);
    this.addView(this._listView);
  },

  _setupCollection: function () {
    var requiredNumberOfColors = this._computeRequiredNumberOfColors();
    var ramps = CartoColor.getQualitativeRamps(requiredNumberOfColors);
    var range = this.model.get('range');

    ramps = _.map(ramps, function (ramp, name) {
      var isSelected = false;

      if (ramp && ramp.length && range && range.length) {
        isSelected = ramp.join().toLowerCase() === range.join().toLowerCase();
      }

      if (!ramp) {
        return null;
      }

      return {
        selected: isSelected,
        name: name,
        val: ramp
      };
    }, this);

    this.collection = new CustomListCollection(_.compact(ramps), { silent: false });

    if (!this.collection.getSelectedItem()) {
      this._customRamp.set('range', this.model.get('range'));
    }
  },

  _computeRequiredNumberOfColors: function () {
    return Math.min(this.model.get('domain').length, this._maxValues + 1);
  }
},
{
  EVENTS: EVENTS
});
