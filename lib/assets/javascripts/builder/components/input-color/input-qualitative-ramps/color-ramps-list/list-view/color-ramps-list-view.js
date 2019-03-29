var _ = require('underscore');
var cdb = require('internal-carto.js');
var CoreView = require('backbone/core-view');

var customColorRampTemplate = require('./color-ramp-custom-item.tpl');
var colorRampsListTemplate = require('./color-ramps-list-view.tpl');
var colorRampsListItemTemplate = require('../list-item-view/color-ramps-list-item.tpl');
var ColorRampsListItemView = require('../list-item-view/color-ramps-list-item-view');

var CustomListView = require('builder/components/custom-list/custom-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');

var CartoColor = require('builder/helpers/carto-color');

var EVENTS = {
  CUSTOM_COLOR: 'custom-color',
  RAMP_SELECTED: 'ramp-selected',
  CUSTOMIZE: 'customize'
};

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-qualitative-ramps:color-ramps-list:list-view:color-ramps-list-view',

  events: {
    'click .js-customize': '_onClickCustomize',
    'click .js-clear': '_onClickClear',
    'click .js-customRamp': '_onClickCustomRamp',
    'click .js-back': '_onClickBack'
  },

  initialize: function (options) {
    this.model = options.model;
    this._maxValues = options.maxValues;
    this._requiredNumberOfColors = options.requiredNumberOfColors;

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();
    this.$el.append(colorRampsListTemplate());

    var customRamp = this._customRamp.get('range');

    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: false,
      typeLabel: this._typeLabel,
      itemTemplate: colorRampsListItemTemplate,
      itemView: ColorRampsListItemView
    });

    this._listView.bind('customize', function (ramp) {
      this.trigger('customize', ramp, this);
    }, this);

    this.$('.js-rampsList').append(this._listView.render().el);
    this.addView(this._listView);

    if (customRamp && customRamp.length) {
      this.$('.js-customList').addClass('is-customized');
      this.$('.js-customList').prepend(customColorRampTemplate({
        customRamp: customRamp
      }));
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
    var ramps = CartoColor.getQualitativeRamps(this._requiredNumberOfColors);
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
      this.collection.first().set('selected', true, { silent: true });
    }

    this.render();
    this._listView.highlight();
  },

  _onClickCustomRamp: function (e) {
    this.killEvent(e);

    if (this._customRamp.get('range')) {
      this.trigger('customize', this.collection.getSelectedItem(), this);
    }
  }
},
{
  EVENTS: EVENTS
});
