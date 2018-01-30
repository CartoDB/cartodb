var _ = require('underscore');
var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var rampItemTemplate = require('./input-ramp-list-item-template.tpl');
var rampItemView = require('./input-ramp-list-item-view');
var customRampTemplate = require('./custom-ramp-template.tpl');
var template = require('./input-ramp-content-view.tpl');
var CartoColor = require('../../../../../../../../helpers/carto-color');

var DEFAULT_RAMP_ITEM_COLOR = '#CCCCCC';

module.exports = CoreView.extend({
  events: {
    'click .js-customize': '_onClickCustomize',
    'click .js-clear': '_onClickClear',
    'click .js-customRamp': '_onClickCustomRamp',
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    this._typeLabel = opts.typeLabel;

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      attribute: this.model.get('attribute')
    }));

    this._initViews();

    var customRamp = this._customRamp.get('range');

    this.$('.js-customList').prepend(customRampTemplate({
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

  _initModels: function () {
    this._customRamp = new cdb.core.Model();
    this._setupCollection();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:attribute_type', this._updateRampOnAttributeChange);
    this.listenTo(this.collection, 'change:selected', this._onSelectItem);
  },

  _initViews: function () {
    this._listView = new CustomListView({
      collection: this.collection,
      typeLabel: this._typeLabel,
      itemTemplate: rampItemTemplate,
      itemView: rampItemView
    });

    this._listView.bind('invert', this._invertRamp, this);
    this._listView.bind('customize', function (ramp) {
      this.trigger('customize', ramp, this);
    }, this);

    this.$('.js-content').append(this._listView.render().el);
    this.addView(this._listView);
  },

  _setupCollection: function () {
    var ramps = this._getRamps();
    this.collection = new CustomListCollection(_.compact(ramps), { silent: false });
    if (!this.collection.getSelectedItem()) {
      this._customRamp.set('range', this.model.get('range'));
    }
  },

  _getRamps: function () {
    return this.model.get('colors');
  },

  _updateRampOnAttributeChange: function (m, type) {
    var ramps = this._getRamps();
    // Update the ramps when the attribute changes
    this.collection.reset(_.compact(ramps), {silent: true});
    // and delete the custom ramp
    this._customRamp.set('range', false);

    // apply the first ramp
    var first = this.collection.first();
    first && first.set('selected', true);
    this.render();
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

  _onSelectItem: function (item) {
    this._selectRamp(item);
    this.trigger('selectItem', item, this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }

});
