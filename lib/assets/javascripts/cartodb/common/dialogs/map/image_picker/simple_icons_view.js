var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model({ value: '' });
    this.createModel = this.options.model;
    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/simple_icons_template');

    var opts = {};
    if (this.options.folder !== undefined)  opts.folder = this.options.folder;
    if (this.options.size   !== undefined)  opts.size   = this.options.size;
    if (this.options.host   !== undefined)  opts.host   = this.options.host;
    if (this.options.ext    !== undefined)  opts.ext    = this.options.ext;

    if (!_.isEmpty(opts)) {
      this.options.icons = _.map(this.options.icons, function(a) {
        return _.extend(a,opts);
      })
    }

    this.collection = new cdb.admin.StaticAssets(this.options.icons);

  },

  render: function() {
    this.clearSubViews();

    this.$el.html(this.template());

    // render new items
    var items = this.collection.where({ kind: this.options.kind });
    var self = this;

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

    // White shadows...
    var scrolls = new cdb.admin.CustomScrolls({
      el:     this.$('ul'),
      parent: this.$el
    });
    this.addView(scrolls);

    return this;
  },

  _selectItem: function(m) {
    this.model.set('value', m.get('public_url'));
    this.trigger('fileChosen', this);
    this._unselectItems(m);
  },

  // Unselect all images expect the new one 
  _unselectItems: function(m) {
    this.collection.each(function(mdl) {
      if (mdl != m && mdl.get('state') == 'selected') {
        mdl.set('state', 'idle');
      }
    });
  }
});
