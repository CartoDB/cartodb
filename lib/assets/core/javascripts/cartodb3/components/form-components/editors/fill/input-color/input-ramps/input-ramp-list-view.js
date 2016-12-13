var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampItemView = require('./input-ramp-list-item-view');
var customRampTemplate = require('./custom-ramp-template.tpl');
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

    var customRamp = this._customRamp.get('range');

    this.$('.js-customList').prepend(customRampTemplate({
      customRamp: customRamp
    }));

    if (customRamp) {
      this.$('.js-customList').addClass('is-customized');
    }

    this._selectRamp(this.collection.getSelectedItem());

    return this;
  },

  _setupCollection: function () {
    var attributeType = this.model.get('attribute_type');
    // select only suitable ramps for the data type
    // number -> ramps
    // string -> category
    var rampTypeFromType = {
      number: ['quantitative', 'diverging'],
      string: ['qualitative']
    };
    var ramps = rampList;
    if (rampTypeFromType[attributeType]) {
      ramps = _.filter(ramps, function (r) {
        // ramp without tags is discarded
        if (r.tags) {
          return _.contains(rampTypeFromType[attributeType], r.tags[0]);
        }
        return false;
      });
    }

    ramps = _.map(ramps, function (rampItem, name) {
      var ramp = rampItem[this.model.get('bins')];
      var range = this.model.get('range');
      var isSelected = false;
      var isInverted = false;

      if (ramp && ramp.length && range && range.length) {
        isSelected = ramp.join().toLowerCase() === range.join().toLowerCase();

        if (!isSelected) {
          isSelected = _.clone(ramp).reverse().join().toLowerCase() === range.join().toLowerCase();
          isInverted = isSelected;
        }
      }

      if (!ramp) {
        return null;
      }

      return {
        selected: isSelected,
        inverted: isInverted,
        name: name,
        val: ramp
      };
    }, this);

    this.collection = new CustomListCollection(_.compact(ramps), { silent: false });
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
      itemTemplate: rampItemTemplate,
      itemView: rampItemView
    });

    this._listView.bind('invert', this._invertRamp, this);
    this._listView.bind('customize', function (ramp) {
      this.trigger('customize', ramp, this);
    }, this);
  },

  _invertRamp: function (item) {
    if (!item) {
      return;
    }

    this._customRamp.set('range', null);
    item.set('selected', false);
    var ramp = [].concat(item.get('val')).reverse();
    item.set({ val: ramp, selected: true });
    this.model.set('range', ramp);
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
