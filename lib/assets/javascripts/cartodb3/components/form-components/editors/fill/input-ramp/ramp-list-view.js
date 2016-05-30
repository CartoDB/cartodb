var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./ramp-list.tpl');
var inputRampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampList = require('./ramps');

var CustomListView = require('../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../custom-list/custom-list-collection');

module.exports = cdb.core.View.extend({
  defaults: {
    isCustomizable: false
  },

  events: {
    'click .js-customize': '_onClickCustomize'
  },

  initialize: function (opts) {
    if (!opts.bins) throw new Error('bins is required');

    this._customRampList = this.options.customRampLists;

    this._bins = opts.bins;
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;

    this._setupCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      isCustomizable: this.options.isCustomizable
    }));

    var view = new CustomListView({
      collection: this._collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      itemTemplate: inputRampItemTemplate
    });

    this.$('.js-content').append(view.render().$el);

    // TODO: add add_view

    return this;
  },

  _initBinds: function () {
    if (this._customRampList) {
      this._customRampList.bind('add change', this._onChangeCustomRampList, this);
    }

    this._collection.bind('change:selected', this._onSelectItem, this);
    this._collection.bind('reset change', this.render, this);
  },

  _onChangeCustomRampList: function () {
    var ramps = _.map(this._customRampList.models, function (ramp) {
      return { name: ramp.get('name'), val: ramp.get('val') };
    }, this);

    console.log('change ramp list', ramps);
    this._collection.reset(ramps);
  },

  _setupCollection: function () {
    var ramps = [];

    if (this._customRampList) {
      ramps = _.map(this._customRampList.models, function (ramp) {
        return { name: ramp.get('name'), val: ramp.get('val') };
      }, this);
    } else {
      ramps = _.map(rampList, function (ramp, name) {
        return { name: name, val: ramp[this._bins] };
      }, this);
    }

    this._collection = new CustomListCollection(ramps);
  },

  _onClickCustomize: function (e) {
    this.killEvent(e);
    this.trigger('customize', this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item, this);
  }
});
