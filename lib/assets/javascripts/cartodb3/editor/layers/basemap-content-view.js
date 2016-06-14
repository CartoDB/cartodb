var CoreView = require('backbone/core-view');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapCategoryView = require('./basemap-content-views/basemap-category-view');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./basemap-content.tpl');
var basemap_thumbnail = require('./basemap-content-views/basemap-thumbnail.tpl');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._modals = opts.modals;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initCollections();
    this._initBinds();
  },

  _initCollections: function () {
    this._basemapsCollection = new Backbone.Collection();

    _(this._layerDefinitionsCollection._basemaps).each(function (categoryLayers, category) {
      _.map(categoryLayers, function (m, key) {
        var subdomains = m.subdomains;
        // subdomain by default 'a'
        var s = 'a';
        // x,y,z position of the base tile preview
        var x = 30;
        var y = 24;
        var z = 6;

        var thumbnail_url = m.url ? m.url : '';
        var thumbnail_image = thumbnail_url
          .replace('{s}', subdomains && subdomains.length ? subdomains[0] : s)
          .replace('{z}', z)
          .replace('{x}', x)
          .replace('{y}', y);

        var tmpLayer = {
          default: m.default,
          urlTemplate: m.url,
          subdomains: subdomains,
          minZoom: m.minZoom,
          maxZoom: m.maxZoom,
          name: m.name,
          className: m.className,
          attribution: m.attribution,
          category: category,
          labels: m.labels,
          type: 'Tiled',
          selected: this._baseLayer.get('className') === m.className,
          val: m.className,
          label: m.name,
          template: function () {
            return basemap_thumbnail({
              backgroundImage: thumbnail_image
            });
          }
        };

        // default basemaps are defined in app_config.yml
        this._basemapsCollection.add(tmpLayer);
      }, this);
    }, this);

    this._basemapsCollection.add({
      default: false,
      color: this._baseLayer.get('color') || '',
      image: this._baseLayer.get('image') || '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: this._baseLayer.get('className') === 'plain',
      val: 'plain',
      label: 'plain',
      template: function () {
        return 'plain';
      }
    });

    this._categoriesCollection = new CarouselCollection(
      _.map(this._getCategories(), function (category) {
        return {
          selected: this._getBaseLayerCategory() === category,
          val: category,
          label: category,
          template: function () {
            return category;
          }
        };
      }, this)
    );
  },

  _initBinds: function () {
    var self = this;

    this._categoriesCollection.bind('change:selected', this._renderSelect, this);
    this.add_related_model(this._categoriesCollection);

    this._layerDefinitionsCollection.bind('change', function () {
      self._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

      self._renderHeader();
      self._renderSelect();
    }, this);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _getCategories: function () {
    var categories = [];

    this._basemapsCollection.filter(function (mdl) {
      var s = mdl.get('category');

      if (!_.contains(categories, s)) {
        categories.push(s);
      }
    });

    // TODO: push mapbox basemaps
    categories.push('Mapbox');

    // TODO: push custom basemaps
    categories.push('Custom');

    return categories;
  },

  _getDefaultCategory: function () {
    var defaultCategory = this._basemapsCollection.find(function (basemapMdl) {
      return basemapMdl.get('default');
    }, this);

    return defaultCategory.get('category');
  },

  _getSelectedCategory: function () {
    var selectedCategory = this._categoriesCollection.find(function (categoryMdl) {
      return categoryMdl.get('selected');
    }, this);

    return selectedCategory.get('val');
  },

  _getBaseLayerCategory: function () {
    // baseLayer has no category at map creation, or if baseLayer is Plain
    var category = this._getDefaultCategory();

    if (this._baseLayer.get('category')) {
      category = this._baseLayer.get('category');
    } else if (this._baseLayer.get('type') === 'Plain') {
      category = 'Color';
    }

    return category;
  },

  _initViews: function () {
    this._renderHeader();

    var categoryView = new BasemapCategoryView({
      categoriesCollection: this._categoriesCollection
    });
    this.addView(categoryView);
    this.$('.js-basemapCategory').html(categoryView.render().el);

    this._renderSelect();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new BasemapHeaderView({
      model: this._layerDefinitionsCollection.getBaseLayer(),
      category: this._getBaseLayerCategory()
    });
    this.addView(this._headerView);
    this.$('.js-basemapHeader').html(this._headerView.render().el);
  },

  _renderSelect: function () {
    if (this._selectView) {
      this.removeView(this._selectView);
      this._selectView.clean();
    }

    this._selectView = new BasemapSelectView({
      basemapsCollection: this._basemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      selectedCategoryVal: this._getSelectedCategory(),
      modals: this._modals
    });
    this.addView(this._selectView);
    this.$('.js-basemapSelect').html(this._selectView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
