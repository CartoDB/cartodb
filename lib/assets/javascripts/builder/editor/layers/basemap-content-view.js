var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');
var template = require('./basemap-content.tpl');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapModelFactory = require('./basemap-content-views/basemap-model-factory');
var BasemapsCollection = require('./basemap-content-views/basemaps-collection');
var BasemapInnerView = require('./basemap-content-views/basemap-inner-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var Notifier = require('builder/components/notifier/notifier');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var Router = require('builder/routes/router');

var NOTIFICATION_ID = 'basemapNotification';

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

var REQUIRED_OPTS = [
  'layerDefinitionsCollection',
  'stackLayoutModel',
  'customBaselayersCollection',
  'basemaps',
  'modals',
  'configModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this.model = new Backbone.Model({
      disabled: false
    });

    this._basemapModelFactory = new BasemapModelFactory(this._layerDefinitionsCollection, this._configModel);

    this._initCollections(opts.basemaps);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
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

  _initViews: function () {
    this._renderHeader();
    this._renderContent();
  },

  _initCollections: function (basemaps) {
    this._basemapsCollection = new BasemapsCollection();
    var basemapModel;

    // Basemaps defined in app_config.yml
    _(basemaps).each(function (categoryBasemaps, category) {
      _.map(categoryBasemaps, function (basemap) {
        basemapModel = this._basemapModelFactory.createBasemapModel(category, basemap);
        this._basemapsCollection.add(basemapModel);
      }, this);
    }, this);

    // userlayers basemaps
    this._customBaselayersCollection.each(function (customBaseLayerDefinitionModel) {
      var category = customBaseLayerDefinitionModel.get('category') || 'Custom';
      basemapModel = this._basemapModelFactory.createBasemapModel(category, customBaseLayerDefinitionModel.attributes);
      this._basemapsCollection.add(basemapModel);
    }, this);

    // Plain color or image basemap
    basemapModel = this._basemapModelFactory.createBasemapModel('Color', {
      color: this._baseLayer.get('color') || '',
      image: this._baseLayer.get('image') || '',
      selected: this._baseLayer.get('className') === 'plain'
    });
    this._basemapsCollection.add(basemapModel);

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
    Router.goToLayerList();
  }
});
