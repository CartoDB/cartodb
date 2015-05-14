var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  initialize: function() {
    this.model = this.options.model;
    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/assets_template');
    this._setupAssets();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._renderAssets();
    return this;
  },

  _setupAssets: function() {
    var opts = {};

    if (this.options.folder !== undefined)  opts.folder = this.options.folder;
    if (this.options.size   !== undefined)  opts.size   = this.options.size;
    if (this.options.host   !== undefined)  opts.host   = this.options.host;
    if (this.options.ext    !== undefined)  opts.ext    = this.options.ext;

    if (!_.isEmpty(opts)) {
      this.options.icons = _.map(this.options.icons, function(a) {
        return _.extend(a, opts);
      });
    }

    this.collection = new cdb.admin.StaticAssets(this.options.icons);
  },

  _renderAssets: function() {

    var self = this;
    var items = this.collection.where({ kind: this.options.kind });

    _(items).each(function(mdl) {
      var item = new cdb.admin.StaticAssetItem({
        className: 'AssetItem ' + (self.options.folder || ''),
        template: 'table/views/asset_manager/static_asset_item',
        model: mdl
      });
      item.bind('selected', self._selectItem, self);

      self.$('ul').append(item.render().el);
      self.addView(item);
    });
  },

  _selectItem: function(m) {
    this.model.set('value', m.get('public_url'));
    this.trigger('fileChosen', this);
    this._unselectItems(m);
  },

  // Unselect all images expect the selected one 
  _unselectItems: function(m) {
    this.collection.each(function(mdl) {
      if (mdl != m && mdl.get('state') == 'selected') {
        mdl.set('state', 'idle');
      }
    });
  }
});
