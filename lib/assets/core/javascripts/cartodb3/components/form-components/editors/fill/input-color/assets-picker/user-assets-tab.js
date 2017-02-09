var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var ScrollView = require('../../../../../scroll/scroll-view');
var AssetsCollection = require('../../../../../../data/assets-collection');
var UserAssetsListView = require('./user-assets-list-view');

var REQUIRED_OPTS = [
  'organizationAssetCollection',
  'userAssetCollection',
  'title',
  'selectedAsset'
];

module.exports = CoreView.extend({
  events: {
    'change .js-uploadInput': '_onFileSelected'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    this._renderAssets();

    return this;
  },

  _renderAssets: function () {
    var view = new ScrollView({
      createContentView: function () {
        var view = new UserAssetsListView({
          title: this._title,
          model: this.model,
          organizationAssetCollection: this._organizationAssetCollection,
          userAssetCollection: this._userAssetCollection,
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
  }

});
