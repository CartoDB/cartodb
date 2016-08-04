var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var template = require('./basemap-content.tpl');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapsCollection = require('./basemap-content-views/basemaps-collection');
var BasemapCategoriesView = require('./basemap-content-views/basemap-categories-view');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');
var basemapThumbnail = require('./basemap-content-views/basemap-thumbnail.tpl');

var BASEMAP_ICONS = {
  gmaps: require('./basemap-content-views/basemap-icons/basemap-gmaps.tpl'),
  carto: require('./basemap-content-views/basemap-icons/basemap-carto.tpl'),
  stamen: require('./basemap-content-views/basemap-icons/basemap-stamen.tpl'),
  color: require('./basemap-content-views/basemap-icons/basemap-color.tpl'),
  mapbox: require('./basemap-content-views/basemap-icons/basemap-mapbox.tpl'),
  custom: require('./basemap-content-views/basemap-icons/basemap-custom.tpl'),
  here: require('./basemap-content-views/basemap-icons/basemap-here.tpl')
};

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.basemaps) throw new Error('basemaps is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._customBaselayersCollection = opts.customBaselayersCollection;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this.model = new Backbone.Model({
      disabled: false
    });

    this._initCollections(opts.basemaps);
    this._initBinds();
  },

  _initCollections: function (basemaps) {
    var self = this;

    this._basemapsCollection = new BasemapsCollection();

    // google maps basemaps not supported yet
    var basemapList = _.clone(basemaps);
    delete basemapList['GMaps'];
    delete basemapList['Google'];

    // basemaps defined in app_config.yml
    _(basemapList).each(function (categoryBasemaps, category) {
      _.map(categoryBasemaps, function (basemap) {
        var name = basemap.name;
        var className = basemap.className;
        var subdomains = basemap.subdomains;
        var urlTemplate = basemap.url;

        this._basemapsCollection.add({
          default: basemap.default,
          urlTemplate: urlTemplate,
          subdomains: subdomains,
          minZoom: basemap.minZoom,
          maxZoom: basemap.maxZoom,
          name: name,
          className: className,
          attribution: basemap.attribution,
          category: category,
          labels: basemap.labels,
          selected: this._baseLayer.get('className') === className,
          val: className,
          label: name,
          template: function () {
            return basemapThumbnail({
              backgroundImage: self._getThumbnailImage(urlTemplate, subdomains)
            });
          }
        });
      }, this);
    }, this);

    // userlayers basemaps
    this._customBaselayersCollection.each(function (mdl) {
      var name = mdl.get('name') ? mdl.get('name') : 'Custom basemap ' + mdl.get('order');
      var className = mdl.get('className');
      var urlTemplate = mdl.get('urlTemplate');

      this._basemapsCollection.add({
        id: mdl.get('id'),
        urlTemplate: urlTemplate,
        minZoom: mdl.get('minZoom') || 0,
        maxZoom: mdl.get('maxZoom') || 21,
        name: name,
        className: className,
        attribution: mdl.get('attribution'),
        category: mdl.get('category') || 'Custom',
        selected: mdl.get('selected'),
        val: className,
        label: name,
        template: function () {
          return basemapThumbnail({
            backgroundImage: self._getThumbnailImage(urlTemplate)
          });
        }
      });
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
      _.map(this._basemapsCollection.getCategories(), function (category) {
        return {
          selected: this._getBaseLayerCategory() === category,
          val: category,
          label: category,
          template: function () {
            var template = this._getTemplateForCategory(category.toLowerCase());
            return template();
          }.bind(this)
        };
      }, this)
    );
  },

  _getThumbnailImage: function (urlTemplate, subdomains) {
    // subdomain by default 'a'
    var s = 'a';
    // x,y,z position of the base tile preview
    var x = 30;
    var y = 24;
    var z = 6;

    var thumbnail_image = urlTemplate
      .replace('{s}', (subdomains && subdomains.length) ? subdomains[0] : s)
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);

    return thumbnail_image;
  },

  _getTemplateForCategory: function (categoryName) {
    var template = BASEMAP_ICONS[categoryName.toLowerCase()];
    if (!template) {
      template = function () {
        return categoryName;
      };
    }
    return template;
  },

  _disable: function () {
    this.model.set('disabled', true);
  },

  _enable: function () {
    this.model.set('disabled', false);
  },

  _initBinds: function () {
    this.model.bind('change:disabled', function () {
      this.$el.find('.js-basemapContent').toggleClass('is-disabled', this.model.get('disabled'));
      this._renderSelect();
    }, this);
    this._categoriesCollection.bind('change:selected', this._onChangeSelectedCategory, this);
    this.add_related_model(this._categoriesCollection);

    this._basemapsCollection.bind('change:selected', this._onChangeSelectedBasemap, this);
    this._basemapsCollection.bind('add', this._onAddBasemap, this);
    this.add_related_model(this._basemapsCollection);

    this._layerDefinitionsCollection.bind('savingLayers', this._disable, this);
    this._layerDefinitionsCollection.bind('savingLayersFinish', this._enable, this);
    this._layerDefinitionsCollection.bind('change', function () {
      this._renderHeader();

      this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();
      this._updateSelectedCategory(this._baseLayer.get('category'));
    }, this);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _updateSelectedCategory: function (cat) {
    var newCategory = this._categoriesCollection.findWhere({ val: cat });
    newCategory && newCategory.set({ selected: true });
  },

  _getSelectedCategory: function () {
    var selectedCategory = this._categoriesCollection.findWhere({ selected: true });

    return selectedCategory && selectedCategory.get('val');
  },

  _getBaseLayerCategory: function () {
    // baseLayer has no category if baseLayer is Plain
    var category = this._basemapsCollection.getDefaultCategory();

    if (this._baseLayer.get('type') === 'Plain') {
      category = 'Color';
    } else {
      category = this._baseLayer.get('category') ? this._baseLayer.get('category') : 'Custom';
    }

    return category;
  },

  _initViews: function () {
    this._renderHeader();
    this._renderCategories();
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

  _onAddBasemap: function (mdl) {
    this._basemapsCollection.updateSelected(mdl.getValue());
  },

  _onChangeSelectedBasemap: function (mdl, isSelected) {
    if (isSelected) {
      this._customBaselayersCollection.updateSelected(mdl.get('id'));
    }
  },

  _onChangeSelectedCategory: function (mdl, isSelected) {
    if (isSelected) {
      this._renderCategories();
      this._renderSelect();
    }
  },

  _renderSelect: function () {
    if (this._selectView) {
      this.removeView(this._selectView);
      this._selectView.clean();
    }

    this._selectView = new BasemapSelectView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      selectedCategoryVal: this._getSelectedCategory(),
      disabled: this.model.get('disabled')
    });
    this.addView(this._selectView);
    this.$('.js-basemapSelect').html(this._selectView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
