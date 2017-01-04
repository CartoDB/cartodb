var CoreView = require('backbone/core-view');
var template = require('./input-color-file-view.tpl');
var AssetsView = require('./assets-picker/assets-view');
var CarouselFormView = require('../../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../../components/custom-carousel/custom-carousel-collection');
var StaticAssetsCollection = require('../../../../../data/static-assets-collection');
var StaticAssetModel = require('../../../../../data/static-asset-model');
var AssetTemplate = require('./assets-picker/static-asset-item-view.tpl');
var CarouselTemplate = require('./input-color-file-carousel.tpl');
var MakiIcons = require('./assets/maki-icons');

module.exports = CoreView.extend({

  events: {
    'click .js-show-collection': '_onClickShowCollection'
  },

  initialize: function (opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;

    this._initCarouselCollection();
    this._renderAssets();

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._renderAssets();

    return this;
  },

  _initBinds: function () {
    this._carouselCollection.on('change:selected', this._onSelectAsset, this);
    this._carouselCollection.on('reset', this.render, this);
  },

  _resetCarouselCollection: function (url) {
    this._icons.reset(MakiIcons.icons);

    var selectedItem = this._carouselCollection.find(function (m) { return m.get('url') === url; });

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
      action: function (m) {
        this._resetImage(m);
      }.bind(this)
    });

    this._icons.unshift(this._resetAsset);

    this._carouselCollection = new CarouselCollection(this._getIcons());
    this.add_related_model(this._carouselCollection);
  },

  _getIcons: function () {
    var defaultAction = function (m) {
      this._changeIcon(m);
    }.bind(this);

    return this._icons.map(function (icon) {
      var type = icon.get('type') ? icon.get('type') : 'icon';
      var action = icon.get('action') ? icon.get('action') : defaultAction;

      return {
        selected: icon.get('selected') || icon.getURLFor(icon.get('icon')) === this._getIconSelected(),
        icon: icon,
        type: type,
        name: icon.get('name'),
        url: icon.get('public_url'),
        action: action,
        template: function () {
          return AssetTemplate({ type: type, public_url: icon.get('public_url') + '?req=markup', name: icon.get('name') });
        }
      };
    }, this);
  },

  _getIconSelected: function () {
    var rampIndex = this.model.get('index');
    var categoryImage = this.model.get('ramp')[rampIndex].image;

    return categoryImage || this.model.get('image');
  },

  _renderAssets: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: CarouselTemplate,
      itemOptions: {
        className: 'AssetItem-button'
      }
    });

    this.addView(view);
    this.$('.js-assets').append(view.render().el);
  },

  _onSelectAsset: function (m) {
    m.get('action')(m);
  },

  _changeIcon: function (m) {
    this.trigger('change', m.get('icon').get('public_url'), this);
  },

  _resetImage: function () {
    this.trigger('change', null, this);
  },

  _onClickShowCollection: function (e) {
    this.killEvent(e);

    var self = this;

    this._modals.create(function (modalModel) {
      var view = new AssetsView({
        model: self.model,
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel
      });

      view.bind('change', function (url) {
        this._resetCarouselCollection(url);
        this.trigger('change', url, this);
      }, self);

      return view;
    });
  }
});
