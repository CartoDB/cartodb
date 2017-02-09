var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var ScrollView = require('../../../../../scroll/scroll-view');
var OrganizationAssetsCollection = require('../../../../../../data/organization-assets-collection');
var OrganizationAssetsListView = require('./organization-assets-list-view');

var REQUIRED_OPTS = [
  'organizationAssetCollection',
  'userAssetCollection',
  'title',
  'selectedAsset'
];

module.exports = CoreView.extend({
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
        var view = new OrganizationAssetsListView({
          title: this._title,
          model: this.model,
          organizationAssetCollection: this._organizationAssetCollection,
          userAssetCollection: this._userAssetCollection,
          selectedAsset: this._selectedAsset
        });

        return view;
      }.bind(this)
    });

    this.addView(view);
    this.$el.append(view.render().el);
  }
});
