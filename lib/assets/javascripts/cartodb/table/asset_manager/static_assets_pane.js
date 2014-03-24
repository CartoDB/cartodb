  
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

    _TEXTS: {
      disclaimer: _t('<a href="https://github.com/mapbox/maki" target="_blank">Maki icons</a> belongs to MapBox<sup>(TM)</sup>')
    },

    className: 'assets makis',

    initialize: function() {
      this.template = this.options.template || cdb.templates.getTemplate('table/views/asset_manager/static_assets_pane');
      
      this.model = new cdb.core.Model({ value: '' });

      this.collection = new cdb.admin.StaticAssets(maki_icons);
    },

    render: function() {

      // clean old views
      this.clearSubViews();

      this.$el.html(this.template(this._TEXTS));

      // render new items
      var items = this.collection.where({ kind: this.options.kind });
      var self = this;

      _(items).each(function(mdl) {
        var item = new cdb.admin.StaticAssetItem({
          template: 'table/views/asset_manager/static_asset_item',
          model: mdl
        });
        item.bind('selected', self._selectItem, self);

        self.$('ul').append(item.render().el);
        self.addView(item);
      });

      return this;
    },

    _selectItem: function(m) {
      cdb.admin.AssetsPane.prototype._selectItem.call(this, m);
      this.trigger('fileChosen', this);
    },


  });