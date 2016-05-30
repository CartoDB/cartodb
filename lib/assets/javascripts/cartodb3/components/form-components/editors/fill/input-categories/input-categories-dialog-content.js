var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var InputColorPickerView = require('../input-color/input-color-picker-view');
var CategoriesListView = require('./categories-list-view');
// var InputRampListView = require('../input-ramp/input-ramp-list-view');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this._initModels();
    this._initBinds();
    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _initModels: function () {
    this._selectedColorModel = new cdb.core.Model();
    this.add_related_model(this._selectedColorModel);
  },

  _initBinds: function () {
    this._selectedColorModel.bind('change', this._onChangeColor, this);
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createColumnListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createColorPickerView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });
  },

  _onChangeColor: function () {
    var categories = this.model.get('categories');
    _.each(categories, function (category) {
      if (this._selectedColorModel.get('label') === category.title) {
        category.color = this._selectedColorModel.get('val');
      }
    }, this);

    this.model.set('categories', categories);
    this.model.trigger('change:categories', categories);
  },

  _updateCategories: function (categories) {
    this.model.set('categories', categories);
    this.model.trigger('change:categories', categories);
  },

  _createColorPickerView: function (stackLayoutModel, opts) {
    var index = 0;

    _.each(this.model.get('categories'), function (category, i) {
      if (this._selectedColorModel.get('label') === category.title) {
        index = i;
      }
    }, this);

    var view = new InputColorPickerView({
      index: index,
      ramp: this.model.get('categories')
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('change', this._updateCategories, this);

    return view;
  },

  _createColumnListView: function (stackLayoutModel, opts) {
    var view = new CategoriesListView({
      categories: this.model.get('categories')
    });

    var self = this;

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (value) {
      self._selectedColorModel.set({
        label: value.get('label'),
        val: value.get('val')
      });
      stackLayoutModel.nextStep();
    }, this);

    return view;
  }
});
