var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');

var CustomRampTemplate = require('./custom-ramp-template.tpl');
var InputCategoriesRampListTemplate = require('./input-categories-ramps-list-view.tpl');
var InputCategoryRampsListItemTemplate = require('./input-categories-ramps-list-item.tpl');
var InputCategoryRampsListItemView = require('./input-categories-ramps-list-item-view');

var CustomListView = require('../../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../../custom-list/custom-list-collection');

var CartoColor = require('../../../../../../../helpers/carto-color');

var EVENTS = {
  CUSTOM_COLOR: 'custom-color',
  RAMP_SELECTED: 'ramp-selected',
  CUSTOMIZE: 'customize'
};

module.exports = CoreView.extend({
  events: {
    'click .js-customize': '_onClickCustomize',
    'click .js-clear': '_onClickClear',
    'click .js-customRamp': '_onClickCustomRamp',
    'click .js-back': '_onClickBack'
  },

  initialize: function (options) {
    this.model = options.model;
    this._maxValues = options.maxValues;

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();
    this.$el.append(InputCategoriesRampListTemplate());

    var customRamp = this._customRamp.get('range');

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: false,
      typeLabel: this._typeLabel,
      itemTemplate: InputCategoryRampsListItemTemplate,
      itemView: InputCategoryRampsListItemView
    });

    this._listView.bind('customize', function (ramp) {
      this.trigger('customize', ramp, this);
    }, this);

    this.$('.js-rampsList').append(this._listView.render().el);
    this.addView(this._listView);

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

  _onSelectItem: function (item) {
    var range = item.get('val');
    this.model.set('range', range);
    this.trigger(EVENTS.RAMP_SELECTED, range, this);
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
    return this.model.get('domain')
      ? Math.min(this.model.get('domain').length, this._maxValues + 1)
      : this._maxValues + 1;
  },

  _onClickCustomize: function (e) {
    this.killEvent(e);
    var ramp = this.collection.getSelectedItem();
    this._customRamp.set('range', ramp);
    this.trigger(EVENTS.CUSTOMIZE, ramp, this);
  },

  _onClickClear: function (e) {
    this.killEvent(e);

    this._customRamp.set('range', null);

    if (!this.collection.getSelectedItem()) {
      this.collection.first().set('selected', true);
    }

    this.render();
    this._listView.highlight();
  },

  _onClickCustomRamp: function (e) {
    this.killEvent(e);

    if (this.model.get('range') === this._customRamp.get('range')) {
      this.trigger('customize', this.collection.getSelectedItem(), this);
    } else {
      this.model.set('range', this._customRamp.get('range'));
    }

    this.$('.js-listItemLink').removeClass('is-selected');
    this.$('.js-customRamp').addClass('is-selected');
  }
},
{
  EVENTS: EVENTS
});
