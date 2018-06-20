var _ = require('underscore');
var CoreView = require('backbone/core-view');
var StaticAssetItemView = require('./static-asset-item-view');
var StaticAssetsCollection = require('builder/data/static-assets-collection');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'icons',
  'selectedAsset'
];

module.exports = CoreView.extend({
  tagName: 'ul',
  className: 'AssetsList',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._setupAssets(opts);
  },

  render: function () {
    this.clearSubViews();
    this._renderAssets();
    return this;
  },

  _renderAssets: function () {
    this._assetsCollection.each(function (mdl) {
      var item = new StaticAssetItemView({
        model: mdl
      });

      if (this.model && item.model.getURLFor(mdl.get('icon')) === this.model.get('image')) {
        item.model.set('state', 'selected');
      }

      item.bind('selected', this._selectItem, this);

      this.$el.append(item.render().el);
      this.addView(item);
    }, this);
  },

  _setupAssets: function (opts) {
    if (!_.isEmpty(opts)) {
      this._icons = _.map(this._icons, function (asset) {
        return _.extend(asset, opts);
      });
    }

    var assets = this._icons;

    if (this.options.limit) {
      assets = assets.slice(0, this.options.limit);
    }

    this._assetsCollection = new StaticAssetsCollection(assets);
    this.add_related_model(this._assetsCollection);
  },

  _selectItem: function (m) {
    this._selectedAsset.set({
      url: m.get('public_url'),
      kind: m.get('kind')
    });

    this._assetsCollection.deselectAll(m);
  }
});
