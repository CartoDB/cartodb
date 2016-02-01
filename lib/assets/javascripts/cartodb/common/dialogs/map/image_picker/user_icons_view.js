var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var AssetsView = require('./assets_view');
var AssetsItemView = require('./assets_item_view');

module.exports = AssetsView.extend({

  className: 'AssetPane AssetPane-userIcons',

  initialize: function() {
    this.model = this.options.model;
    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/assets_template');

    this.collection.bind('add remove reset', this.render, this);
  },

  _renderAssets: function() {

    var self = this;
    var items = this.collection.where({ kind: this.options.kind });

    _(items).each(function(mdl) {
      var item = new AssetsItemView({
        className: 'AssetItem AssetItem-User',
        model: mdl
      });
      item.bind('selected', self._selectItem, self);

      self.$('ul').append(item.render().el);
      self.addView(item);
    });
  }
});
