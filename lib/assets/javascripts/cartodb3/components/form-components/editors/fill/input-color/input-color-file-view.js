var cdb = require('cartodb.js');
var CoreView = require('backbone/core-view');
var template = require('./input-color-file-view.tpl');
var AssetsView = require('./assets-view');

var AssetsCollection = require('../../../../../data/assets-collection');
var AssetsListView = require('./assets-list-view');

var MakiIcons = require('./assets/maki-icons');

module.exports = CoreView.extend({
  events: {
    'click .js-upload': '_onClickUpload',
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

    this._assets = new AssetsCollection(null, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.model = new cdb.core.Model({
      disclaimer: '',
      fetched: false
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this.model.get('fetched')) {
      this._renderAssets();
    }

    return this;
  },

  _onFetchError: function () {
    this.model.set('fetched', false);
  },

  _onFetchSuccess: function () {
    this.model.set('fetched', true);
    this._renderAssets();
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

  _renderAssets: function () {
    this.clearSubViews();
    this.$el.html(template());

    var makiIcons = new AssetsListView({
      model: this.model,
      limit: 10,
      icons: MakiIcons.icons,
      disclaimer: MakiIcons.disclaimer,
      folder: 'maki-icons',
      size: 18
    });

    makiIcons.bind('selected', function (mdl) {
      this.trigger('change', mdl.get('value'), this);
    }, this);

    this.$('.js-recently').append(makiIcons.render().$el);
  },

  _onClickUpload: function (e) {
    this.killEvent(e);
  },

  _onClickResetFile: function (e) {
    this.killEvent(e);
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
