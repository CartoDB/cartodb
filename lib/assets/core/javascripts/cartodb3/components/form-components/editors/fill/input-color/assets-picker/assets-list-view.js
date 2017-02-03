var _ = require('underscore');
var CoreView = require('backbone/core-view');
var StaticAssetItemView = require('./static-asset-item-view');
var StaticAssetsCollection = require('../../../../../../data/static-assets-collection');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'icons',
  'selectedAsset'
];

module.exports = CoreView.extend({
  tagName: 'ul',
  className: 'AssetsList',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (this.options.folder !== undefined) {
      opts.folder = this.options.folder;
    }

    if (this.options.size !== undefined) {
      opts.size = this.options.size;
    }

    if (this.options.host !== undefined) {
      opts.host = this.options.host;
    }

    if (this.options.ext !== undefined) {
      opts.ext = this.options.ext;
    }

    this._setupAssets(opts);
  },

  render: function () {
    this.clearSubViews();
    this._renderAssets();
    return this;
  },

  _renderAssets: function () {
    this._assets.each(function (mdl) {
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

    this._assets = new StaticAssetsCollection(assets);
    this.add_related_model(this._assets);
  },

  _selectItem: function (m) {
    this._selectedAsset.set({
      url: m.get('public_url'),
      kind: m.get('kind')
    });

    this.unselectAssets(m);
  },

  unselectAssets: function (m) {
    this._assets.each(function (mdl) {
      if (mdl !== m && mdl.get('state') === 'selected') {
        mdl.set('state', 'idle');
      }
    });
  }
});
