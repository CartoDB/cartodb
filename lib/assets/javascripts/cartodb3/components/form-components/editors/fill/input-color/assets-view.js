var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var template = require('./assets-view.tpl');

var AssetsListView = require('./assets-list-view');
var AssetsCollection = require('../../../../../data/assets-collection');
var renderLoading = require('../../../../../components/loading/render-loading');

var MakiIcons = require('./assets/maki-icons');
var PinIcons = require('./assets/pin-icons');
var SimpleIcons = require('./assets/simple-icons');

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_onSetImage'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;

    this._assets = new AssetsCollection(null, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.model = new cdb.core.Model({
      disclaimer: '',
      fetched: false
    });

    this.model.bind('change', this._onChangeModel, this);
    this.model.bind('change:fetched', this.render, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    if (this.model.get('fetched')) {
      this._renderAssets();
    } else {
      this._renderLoadingView();
    }

    return this;
  },

  _initBinds: function () {
    if (this.model.get('fetched')) {
      return;
    }

    this._assets.fetch({
      error: this._onFetchError(),
      success: this._onFetchSuccess()
    });
  },

  _onFetchError: function () {
    this.model.set('fetched', false);
  },

  _onFetchSuccess: function () {
    this.model.set('fetched', true);
  },

  _onChangeModel: function () {
    this.$('.js-add').removeClass('is-disabled');
  },

  _renderAssets: function () {
    this.$el.html(template());

    var pinIcons = new AssetsListView({
      model: this.model,
      title: 'Pin icons',
      icons: PinIcons.icons,
      disclaimer: PinIcons.disclaimer,
      folder: 'pin-maps',
      size: ''
    });

    this.$('.js-body').append(pinIcons.render().$el);

    var simpleIcons = new AssetsListView({
      model: this.model,
      title: 'Simple icons',
      icons: SimpleIcons.icons,
      disclaimer: SimpleIcons.disclaimer,
      folder: 'simpleicon',
      size: ''
    });

    this.$('.js-body').append(simpleIcons.render().$el);

    var makiIcons = new AssetsListView({
      model: this.model,
      title: 'Maki icons',
      icons: MakiIcons.icons,
      disclaimer: MakiIcons.disclaimer,
      folder: 'maki-icons',
      size: 18
    });

    this.$('.js-body').append(makiIcons.render().$el);
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
      })
    );
  },

  _onSetImage: function () {
    this.trigger('change', this.model.get('value'), this);
    this._modalModel.destroy(this.model);
  }
});
