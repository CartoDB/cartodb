var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var UserIconsView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/user_icons_view');
var IconView = require('../icons/organization_icon_view');

module.exports = UserIconsView.extend({

  className: 'AssetPane AssetPane-userIcons',

  initialize: function() {
    this.model = this.options.model;
    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/assets_template');

    this.collection.bind('add remove reset', this.render, this);
  },

  _renderAssets: function() {
    var self = this;
    var items = this.collection.where({ kind: this.options.kind });

    _(items).each(function(iconModel) {
      var iconView = new IconView({
        model: iconModel
      });
      iconView.render();
      self.$('ul').append(iconView.$el);
      self.addView(iconView);
    });
  }
});
