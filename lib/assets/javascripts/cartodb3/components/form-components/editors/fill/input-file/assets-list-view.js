var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./assets-list-view.tpl');
var StaticAssetItemView = require('./static-asset-item-view')
var StaticAssetsCollection = require('../../../../../data/static-assets-collection');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.icons) throw new Error('icons is required');

    this._icons = opts.icons;
    this._items = new StaticAssetsCollection(this._icons.icons);
  },

  render: function () {
    this.clearSubViews();
    this.$el.append(template());

    this._items.each(function (mdl) {
      var item = new StaticAssetItemView({
        className: 'AssetItem ' + (this.options.folder || ''),
        model: mdl
      });

      item.bind('selected', this._selectItem, this);

      this.$('.js-assets').append(item.render().el);
      this.addView(item);
    }, this);

    return this;
  }
});
