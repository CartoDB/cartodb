var CoreView = require('backbone/core-view');
var template = require('./input-color-file-view.tpl');
var AssetsView = require('./assets-view');
var CarouselFormView = require('../../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../../components/custom-carousel/custom-carousel-collection');
var StaticAssetsCollection = require('../../../../../data/static-assets-collection');
var AssetTemplate = require('./static-asset-item-view.tpl');

var MakiIcons = require('./assets/maki-icons');

module.exports = CoreView.extend({

  events: {
    'click .js-show-collection': '_onClickShowCollection',
    'click .js-resetFile': '_onClickResetFile'
  },

  initialize: function (opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;

    this._icons = new StaticAssetsCollection(MakiIcons.icons);

    this.add_related_model(this._icons);

    this._carouselCollection = new CarouselCollection(
      this._icons.map(function (icon) {
        return {
          selected: icon.getURLFor(icon.get('icon')) === this.model.get('image'),
          icon: icon,
          name: icon.get('name'),
          template: function () {
            return AssetTemplate({ public_url: icon.get('public_url'), name: icon.get('name') });
          }
        };
      }, this)
    );

    this.add_related_model(this._carouselCollection);

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
  },

  _renderAssets: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('./input-color-file-carousel.tpl'),
      carouselItem: {
        className: 'AssetItem-button'
      }
    });

    this.addView(view);
    this.$('.js-assets').append(view.render().el);
  },

  _onSelectAsset: function (m) {
    this.trigger('change', m.get('icon').get('public_url'), this);
  },

  _onClickResetFile: function (e) {
    this.killEvent(e);

    var selectedItem = this._carouselCollection.find('selected');

    if (selectedItem) {
      selectedItem.set('selected', false);
    }

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
        this.trigger('change', url, this);
      }, self);

      return view;
    });
  }
});
