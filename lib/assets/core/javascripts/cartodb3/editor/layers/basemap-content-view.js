var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var template = require('./basemap-content.tpl');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapsCollection = require('./basemap-content-views/basemaps-collection');
var BasemapInnerView = require('./basemap-content-views/basemap-inner-view');
var mosaicThumbnail = require('../../components/mosaic/mosaic-thumbnail.tpl');
var ScrollView = require('../../components/scroll/scroll-view');
var Notifier = require('../../components/notifier/notifier');
var basemapProvidersAndCategories = require('../../data/basemap-providers-and-categories');

var NOTIFICATION_ID = 'basemapNotification';
var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;

var BASEMAP_ICONS = {
  gmaps: require('./basemap-content-views/basemap-icons/basemap-gmaps.tpl'),
  carto: require('./basemap-content-views/basemap-icons/basemap-carto.tpl'),
  stamen: require('./basemap-content-views/basemap-icons/basemap-stamen.tpl'),
  color: require('./basemap-content-views/basemap-icons/basemap-color.tpl'),
  mapbox: require('./basemap-content-views/basemap-icons/basemap-mapbox.tpl'),
  custom: require('./basemap-content-views/basemap-icons/basemap-custom.tpl'),
  here: require('./basemap-content-views/basemap-icons/basemap-here.tpl'),
  wms: require('./basemap-content-views/basemap-icons/basemap-wms.tpl'),
  tilejson: require('./basemap-content-views/basemap-icons/basemap-tilejson.tpl'),
  nasa: require('./basemap-content-views/basemap-icons/basemap-nasa.tpl')
};

var MAPPINGS = {
  'url': 'urlTemplate'
};

var getBasemapAttrs = function (basemap, category, baseLayerDefinition, assetsBaseURL) {
  var value;
  var currentValue;
  var label;
  var imageURL;

  var basemapAttrs = {};
  _.each(basemap, function (value, key) {
    key = MAPPINGS[key] || key;
    basemapAttrs[key] = value;
  });

  var type = basemapProvidersAndCategories.getLayerType(category);
  if (basemapProvidersAndCategories.isGoogleMapsCategory(category)) {
    var generateValue = function (baseType, baseName) {
      var value = baseType;
      if (baseName) {
        value = value + '_' + baseName;
      }
      return value;
    };
    value = generateValue(basemap.baseType, basemap.baseName);
    currentValue = generateValue(baseLayerDefinition.get('baseType'), baseLayerDefinition.get('baseName'));
    label = basemap.name.replace('GMaps ', '');
    imageURL = [
      assetsBaseURL,
      'unversioned/images/google-maps-basemap-icons',
      value + '.jpg'
    ].join('/');
  } else {
    value = basemap.className;
    currentValue = baseLayerDefinition.get('className');
    label = basemap.name;
    imageURL = lowerXYZ(basemap.url, basemap.subdomains);
  }

  _.extend(basemapAttrs, {
    type: type,
    name: basemap.name,
    category: category,
    selected: currentValue === value,
    val: value,
    label: label,
    template: function () {
      return mosaicThumbnail({
        imgURL: imageURL
      });
    }
  });

  return basemapAttrs;
};

var lowerXYZ = function (urlTemplate, subdomains) {
  return urlTemplate
    .replace('{s}', getSubdomain(subdomains))
    .replace('{z}', DEFAULT_ZOOM)
    .replace('{x}', DEFAULT_X_POSITION)
    .replace('{y}', DEFAULT_Y_POSISTION);
};

var getSubdomain = function (subdomains) {
  return (subdomains && subdomains.length) ? subdomains[0] : DEFAULT_SUBDOMAIN;
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
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._modals = opts.modals;
    this._configModel = opts.configModel;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this.model = new Backbone.Model({
      disabled: false
    });

    this._initCollections(opts.basemaps);
    this._initBinds();
  },

  _initCollections: function (basemaps) {
    this._basemapsCollection = new BasemapsCollection();

    // basemaps defined in app_config.yml
    // TODO: We can move all this logic to BasemapsCollection#initialize
    _(basemaps).each(function (categoryBasemaps, category) {
      _.map(categoryBasemaps, function (basemap) {
        var basemapAttrs = getBasemapAttrs(basemap, category, this._baseLayer, this._configModel.get('app_assets_base_url'));
        this._basemapsCollection.add(basemapAttrs);
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
        tms: mdl.get('tms'),
        selected: this._baseLayer.get('className') === className,
        val: className,
        label: name,
        template: function (imgURL) {
          return mosaicThumbnail({
            imgURL: imgURL
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

  _getTemplateForCategory: function (categoryName) {
    var template = BASEMAP_ICONS[categoryName.toLowerCase()];
    if (!template) {
      template = function () {
        return categoryName;
      };
    }
    return template;
  },

  _onChangingBaseLayer: function () {
    this.model.set('disabled', true);

    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }

    this.notification = Notifier.addNotification({
      id: NOTIFICATION_ID,
      status: 'loading',
      info: _t('editor.layers.basemap.saving.loading'),
      closable: false
    });
  },

  _onBaseLayerChanged: function () {
    this.model.set('disabled', false);

    this.notification.set({
      status: 'success',
      info: _t('editor.layers.basemap.saving.success'),
      closable: true
    });
  },

  _onBaseLayerFailed: function () {
    this.model.set('disabled', false);

    this.notification.set({
      status: 'error',
      info: _t('editor.layers.basemap.saving.error'),
      closable: true
    });
  },

  _initBinds: function () {
    this.model.bind('change:disabled', function () {
      this.$('.js-basemapContent').toggleClass('is-disabled', this.model.get('disabled'));
    }, this);

    this._basemapsCollection.bind('change:category', function (mdl) {
      var userLayersMdl = this._customBaselayersCollection.get(mdl.get('id'));
      userLayersMdl.set('category', mdl.get('category'));
      userLayersMdl.save();
    }, this);
    this._basemapsCollection.bind('remove', function (mdl) {
      var userLayersMdl = this._customBaselayersCollection.get(mdl.get('id'));
      userLayersMdl.destroy();
    }, this);
    this._basemapsCollection.bind('add', this._onAddBasemap, this);
    this.add_related_model(this._basemapsCollection);

    this._layerDefinitionsCollection.bind('changingBaseLayer', this._onChangingBaseLayer, this);
    this._layerDefinitionsCollection.bind('baseLayerChanged', this._onBaseLayerChanged, this);
    this._layerDefinitionsCollection.bind('baseLayerFailed', this._onBaseLayerFailed, this);
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

  _updateSelectedCategory: function (category) {
    var newCategory = this._categoriesCollection.findWhere({ val: category });
    newCategory && newCategory.set({ selected: true });
  },

  _onChangeSelectedCategory: function (mdl, isSelected) {
    if (isSelected) {
      this._renderContent();
    }
  },

  _getBaseLayerCategory: function () {
    var category = this._basemapsCollection.getDefaultCategory();

    if (this._baseLayer.get('category')) {
      category = this._baseLayer.get('category');
    } else if (this._baseLayer.get('type') === 'Plain') {
      category = 'Color';
    } else if (this._customBaselayersCollection.hasCustomBaseLayer(this._baseLayer.get('className'))) {
      category = 'Custom';
    }

    return category;
  },

  _initViews: function () {
    this._renderHeader();
    this._renderContent();
  },

  _renderContent: function () {
    var self = this;

    if (this._contentView) {
      this.removeView(this._contentView);
      this._contentView.clean();
    }

    this._contentView = new ScrollView({
      createContentView: function () {
        return new BasemapInnerView({
          model: self.model,
          categoriesCollection: self._categoriesCollection,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          basemapsCollection: self._basemapsCollection,
          customBaselayersCollection: self._customBaselayersCollection,
          modals: self._modals
        });
      }
    });
    this.addView(this._contentView);
    this.$('.js-basemapContent').html(this._contentView.render().el);
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

  _onAddBasemap: function (mdl) {
    this._basemapsCollection.updateSelected(mdl.getValue());
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
