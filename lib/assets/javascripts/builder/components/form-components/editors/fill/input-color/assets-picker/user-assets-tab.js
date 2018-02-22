var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ScrollView = require('builder/components/scroll/scroll-view');
var UserAssetsListView = require('./user-assets-list-view');

var REQUIRED_OPTS = [
  'userModel',
  'userAssetCollection',
  'title',
  'selectedAsset'
];

module.exports = CoreView.extend({

  className: 'Tab-paneContentInner',

  events: {
    'change .js-uploadInput': '_onFileSelected'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (this._userModel.isInsideOrg()) {
      if (!opts.organizationAssetCollection) throw new Error('organizationAssetCollection is required');

      this._organizationAssetCollection = opts.organizationAssetCollection;
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
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
          selectedAsset: this._selectedAsset,
          userModel: this._userModel
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
