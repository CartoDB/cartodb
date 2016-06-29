var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var customRampTemplate = require('./custom-ramp-template.tpl');
// var rampList = require('./ramps');
var rampList = require('cartocolor');
var template = require('./input-ramp-content-view.tpl');

var DEFAULT_RAMP_ITEM_COLOR = '#CCCCCC';

module.exports = CoreView.extend({
  events: {
    'click .js-customize': '_onClickCustomize',
    'click .js-clear': '_onClickClear',
    'click .js-customRamp': '_onClickCustomRamp',
    'click .js-back': '_onClickBack',
    'click .js-switch': '_onClickSwitch',
    'click .js-quantification': '_onClickQuantification',
    'click .js-bins': '_onClickBins'
  },

  initialize: function (opts) {
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._initModels();
    this._initBinds();
    this._initViews();
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(template({
      bins: this.model.get('bins'),
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    }));

    this.$('.js-content').append(this._listView.render().$el);

    this.$('.js-customList').prepend(customRampTemplate({
      customRamp: this._customRamp.get('range')
    }));

    this._selectRamp(this.collection.getSelectedItem());

    return this;
  },

  _setupCollection: function () {
    var ramps = _.map(rampList, function (rampItem, name) {
      var ramp = rampItem[this.model.get('bins')];
      var range = this.model.get('range');

      var isSelected = false;

      if (ramp && ramp.length && range && range.length) {
        isSelected = ramp.join().toLowerCase() === range.join().toLowerCase();
      }

      return {
        selected: isSelected,
        name: name,
        val: ramp
      };
    }, this);

    this.collection = new CustomListCollection(ramps);
    this.add_related_model(this.collection);

    if (!this.collection.getSelectedItem()) {
      this._customRamp.set('range', this.model.get('range'));
    }
  },

  _initModels: function () {
    this._customRamp = new cdb.core.Model();
    this.add_related_model(this._customRamp);

    this._setupCollection();
  },

  _initBinds: function () {
    this.model.bind('change:bins', this._onChangeBins, this);
    this.collection.bind('change:selected', this._onSelectItem, this);
  },

  _initViews: function () {
    this._listView = new CustomListView({
      collection: this.collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      itemTemplate: rampItemTemplate
    });
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

  _onClickClear: function (e) {
    this.killEvent(e);

    if (!this.collection.getSelectedItem()) {
      this.collection.first().set('selected', true);
    }

    this._customRamp.set('range', null);
    this.render();
    this._listView.highlight();
  },

  _onClickCustomRamp: function (e) {
    this.killEvent(e);
    this.$('.js-listItemLink').removeClass('is-selected');
    this.$('.js-customRamp').addClass('is-selected');
    this.model.set('range', this._customRamp.get('range'));
  },

  _onClickCustomize: function (e) {
    this.killEvent(e);
    var ramp = this.collection.getSelectedItem();
    this._customRamp.set('range', ramp);
    this.trigger('customize', ramp, this);
  },

  _onChangeBins: function () {
    var customRange = this._customRamp.get('range');

    if (customRange) {
      if (this.model.get('bins') > customRange.length) {
        customRange = _.range(this.model.get('bins')).map(function (i) {
          return i >= customRange.length ? DEFAULT_RAMP_ITEM_COLOR : customRange[i];
        });
      } else {
        customRange = customRange.slice(0, this.model.get('bins'));
      }

      this.model.set('range', customRange);
      this._customRamp.set('range', customRange);
    }
  },

  _onSelectItem: function (item) {
    this._selectRamp(item);
    this.trigger('selectItem', item, this);
  },

  _onClickSwitch: function (e) {
    this.killEvent(e);
    this.trigger('switch', this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBins: function (e) {
    this.killEvent(e);
    this.trigger('selectBins', this);
  }
});
