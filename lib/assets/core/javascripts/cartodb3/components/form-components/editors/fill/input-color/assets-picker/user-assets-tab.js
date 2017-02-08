var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var ScrollView = require('../../../../../scroll/scroll-view');
var AssetsCollection = require('../../../../../../data/assets-collection');
var UserAssetsListView = require('./user-assets-list-view');

var REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'title',
  'selectedAsset'
];

module.exports = CoreView.extend({
  events: {
    'change .js-uploadInput': '_onFileSelected'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._assetCollection = new AssetsCollection(
      null, {
        configModel: this._configModel,
        userModel: this._userModel
      }
    );

    this._fetchAllAssets();
  },

  render: function () {
    this.clearSubViews();
    return this;
  },

  _fetchAllAssets: function () {
    this._assetCollection.fetch({
      success: this._renderAssets.bind(this),
      error: this._onFetchAssetsError.bind(this)
    });
  },

  _renderAssets: function () {
    var view = new ScrollView({
      createContentView: function () {
        var view = new UserAssetsListView({
          title: this._title,
          model: this.model,
          assetsCollection: this._assetCollection,
          selectedAsset: this._selectedAsset
        });

        view.bind('init-upload', function () {
          this.trigger('init-upload');
        }, this);

        return view;
      }.bind(this)
    });

    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onFetchAssetsError: function (model, response) {
    this.trigger('error', response);
  }
});
