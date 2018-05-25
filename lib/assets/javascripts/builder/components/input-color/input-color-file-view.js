var CoreView = require('backbone/core-view');
var template = require('./input-color-file-view.tpl');
var AssetsView = require('./assets-picker/assets-view');
var CarouselFormView = require('builder/components/carousel-form-view');
var CarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');
var StaticAssetsCollection = require('builder/data/static-assets-collection');
var StaticAssetModel = require('builder/data/static-asset-model');
var StaticAssetItemViewTemplate = require('./assets-picker/static-asset-item-view.tpl');
var CarouselTemplate = require('./input-color-file-carousel.tpl');
var MakiIcons = require('./assets/maki-icons');

module.exports = CoreView.extend({

  events: {
    'click .js-show-collection': '_onClickShowCollection'
  },

  initialize: function (options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.userModel) throw new Error('userModel is required');
    if (!options.modals) throw new Error('modals is required');

    this._configModel = options.configModel;
    this._userModel = options.userModel;
    this._modals = options.modals;

    this._initCarouselCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderAssets();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._carouselCollection, 'change:selected', this._onSelectAsset);
    this.listenTo(this._carouselCollection, 'reset', this.render);
  },

  _resetCarouselCollection: function (url) {
    this._icons.reset(MakiIcons.icons);

    var selectedItem = this._carouselCollection.find(function (model) {
      return model.get('url') === url;
    });

    if (selectedItem) {
      selectedItem.set('selected', true);
    }

    this._icons.unshift(this._resetAsset);
    this._carouselCollection.reset(this._getIcons());
  },

  _initCarouselCollection: function () {
    this._icons = new StaticAssetsCollection(MakiIcons.icons);
    this.add_related_model(this._icons);

    this._resetAsset = new StaticAssetModel({
      type: 'none',
      selected: !this._getIconSelected(),
      name: _t('form-components.editors.fill.image.none'),
      action: function (model) {
        this._resetImage(model);
      }.bind(this)
    });

    this._icons.unshift(this._resetAsset);

    this._carouselCollection = new CarouselCollection(this._getIcons());
    this.add_related_model(this._carouselCollection);
  },

  _getIcons: function () {
    var defaultAction = function (model) {
      this._changeIcon(model);
    }.bind(this);

    return this._icons.map(function (icon) {
      var type = icon.get('type') ? icon.get('type') : 'icon';
      var action = icon.get('action') ? icon.get('action') : defaultAction;
      var selectedIcon = this._getIconSelected();

      return {
        selected: icon.get('selected') || icon.getURLFor(icon.get('icon')) === selectedIcon,
        icon: icon,
        type: type,
        name: icon.get('name'),
        url: icon.get('public_url'),
        action: action,
        template: function () {
          return StaticAssetItemViewTemplate({
            type: type,
            public_url: icon.get('public_url') + '?req=markup',
            name: icon.get('name')
          });
        }
      };
    }, this);
  },

  _getIconSelected: function () {
    if (this.model.get('ramp')) {
      var rampIndex = this.model.get('index') || 0;
      var categoryImage = this.model.get('ramp')[rampIndex].image;

      return categoryImage || '';
    }

    return this.model.get('image') || '';
  },

  _renderAssets: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: CarouselTemplate,
      listItemOptions: {
        className: 'Carousel-item AssetListItem'
      },
      itemOptions: {
        className: 'AssetItem-button'
      }
    });

    this.addView(view);
    this.$('.js-assets').append(view.render().el);
  },

  _onSelectAsset: function (model) {
    model.get('action')(model);
  },

  _changeIcon: function (model) {
    var icon = model.get('icon');

    this.trigger('change', {
      url: icon.get('public_url'),
      kind: icon.get('kind')
    }, this);
  },

  _resetImage: function () {
    this.trigger('change', null, this);
  },

  _onClickShowCollection: function (e) {
    this.killEvent(e);

    var self = this;

    this._modals.create(function (modalModel) {
      self._assetsView = new AssetsView({
        model: self.model,
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel
      });

      self._assetsView.bind('change', self._resetAssetsView, self);

      return self._assetsView;
    }, {
      breadcrumbsEnabled: true
    });
  },

  _resetAssetsView: function (data) {
    this._resetCarouselCollection(data.url);
    this.trigger('change', data, this);
  },

  _destroyDocumentBinds: function () {
    if (this._assetsView) {
      this._assetsView.unbind('change', self._resetAssetsView, self);
    }
  },

  clean: function () {
    this._destroyDocumentBinds();
    this.trigger('onClean', this);
    CoreView.prototype.clean.apply(this);
  }
});
