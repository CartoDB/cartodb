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
    if (this.options.customRampLists) {
      this.options.customRampLists.bind('change', this.render, this);
    }

    this._collection.bind('change:selected', this._onSelectItem, this);
  },

  _setupCollection: function () {
    var ramps = [];

    if (this.options.customRampLists) {
      ramps = _.map(this.options.customRampLists.models, function (ramp) {
        console.log(ramp);
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
