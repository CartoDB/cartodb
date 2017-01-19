var CoreView = require('backbone/core-view');
var BasemapCategoriesView = require('./basemap-categories-view');
var BasemapSelectView = require('./basemap-select-view');
var template = require('./basemap-inner.tpl');

module.exports = CoreView.extend({

  className: 'Editor-inner',

  initialize: function (opts) {
    if (!opts.categoriesCollection) throw new Error('categoriesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._categoriesCollection = opts.categoriesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._modals = opts.modals;

    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change:disabled', function () {
      this._renderSelect();
    }, this);

    this._basemapsCollection.bind('add remove', function () {
      this._renderSelect();
    }, this);
    this.add_related_model(this._basemapsCollection);

    this._categoriesCollection.bind('change:selected', this._renderSelect, this);
    this.add_related_model(this._categoriesCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _initViews: function () {
    this._renderCategories();
    this._renderSelect();
  },

  _renderCategories: function () {
    if (this._categoriesView) {
      this.removeView(this._categoriesView);
      this._categoriesView.clean();
    }

    this._categoriesView = new BasemapCategoriesView({
      categoriesCollection: this._categoriesCollection
    });

    this.addView(this._categoriesView);
    this.$('.js-basemapCategory').html(this._categoriesView.render().el);
  },

  _renderSelect: function () {
    if (this._selectView) {
      this.removeView(this._selectView);
      this._selectView.clean();
    }

    this._selectView = new BasemapSelectView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      customBaselayersCollection: this._customBaselayersCollection,
      selectedCategoryVal: this._categoriesCollection.getSelectedValue(),
      modals: this._modals,
      disabled: this.model.get('disabled')
    });
    this.addView(this._selectView);
    this.$('.js-basemapSelect').html(this._selectView.render().el);
  }

});
