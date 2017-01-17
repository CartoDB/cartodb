var _ = require('underscore-cdb-v3');
var AssetsView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/assets_view');
var StaticAssetItemView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/static_assets_item_view');

module.exports = AssetsView.extend({
  _renderAssets: function() {
    var self = this;
    var items = this.collection.where({ kind: this.options.kind });

    _(items).each(function(mdl) {
      var item = new StaticAssetItemView({
        className: 'AssetItem AssetsList-item AssetsList-item--small ' + (self.options.folder || ''),
        template: 'common/dialogs/map/image_picker/static_assets_item',
        model: mdl
      });
      item.bind('selected', self._selectItem, self);

      self.$('ul').append(item.render().el);
      self.addView(item);
    });
  }
});
