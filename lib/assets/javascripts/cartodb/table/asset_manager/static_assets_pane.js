  
  /**
   *  Static assets pane
   *
   *  Place where you can display static assets.
   *  Only public_url property is needed in the
   *  asset model.
   *
   *  new cdb.admin.StaticAssetsPane(opts);
   *
   */


  cdb.admin.StaticAssetItem = cdb.admin.AssetsItem.extend({

    events: {
      'click': '_onClick'
    },

    _deleteAsset: function() {},
    _openDropdown: function() {}

  });


  cdb.admin.StaticAssetsPane = cdb.admin.AssetsPane.extend({

    className: 'assets static',

    initialize: function() {
      this.template = this.options.template || cdb.templates.getTemplate('table/views/asset_manager/static_assets_pane');
      
      this.model = new cdb.core.Model({ value: '' });

      if (!this.options.icons) {
        cdb.log.info('A list of icons is necessary to make the list available');
      }

      var opts = {};
      if (this.options.folder !== undefined)  opts.folder = this.options.folder;
      if (this.options.size !== undefined)    opts.size = this.options.size;
      if (this.options.host !== undefined)    opts.host = this.options.host;
      if (this.options.ext !== undefined)     opts.ext = this.options.ext;

      if (!_.isEmpty(opts)) {
        this.options.icons = _.map(this.options.icons, function(a) {
          return _.extend(a,opts);
        })
      }

      this.collection = new cdb.admin.StaticAssets(this.options.icons);
    },

    render: function() {

      // clean old views
      this.clearSubViews();

      this.$el.html(this.template());

      // render new items
      var items = this.collection.where({ kind: this.options.kind });
      var self = this;

      _(items).each(function(mdl) {
        var item = new cdb.admin.StaticAssetItem({
          className: 'assets-item ' + (self.options.folder || ''),
          template: 'table/views/asset_manager/static_asset_item',
          model: mdl
        });
        item.bind('selected', self._selectItem, self);

        self.$('ul').append(item.render().el);
        self.addView(item);
      });

      // Disclaimer
      if (this.options.disclaimer) {
        this.$el.prepend('<div class="disclaimer">' + this.options.disclaimer + '</div>');
      }

      // White shadows...
      var scrolls = new cdb.admin.CustomScrolls({
        el:     this.$('ul'),
        parent: this.$el
      });
      this.addView(scrolls);

      return this;
    },

    _selectItem: function(m) {
      cdb.admin.AssetsPane.prototype._selectItem.call(this, m);
      this.trigger('fileChosen', this);
    },


  });