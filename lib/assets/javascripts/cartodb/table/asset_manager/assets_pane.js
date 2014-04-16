
  /**
   *  Uploaded assets pane
   *
   *  Place where user can choose assets already
   *  uploaded.
   *
   *  new cdb.admin.AssetsPane(opts);
   *
  */

  cdb.admin.AssetsPane = cdb.core.View.extend({

    tagName: 'div',

    className: 'assets',

    initialize: function() {
      this.template = this.options.template || cdb.templates.getTemplate('table/views/asset_manager/uploaded_assets_pane');
      
      this.model = new cdb.core.Model({ value: '' });
      this.collection.bind('add reset', this.render, this);
    },

    render: function() {

      // clean old views
      this.clearSubViews();

      this.$el.html(this.template());

      // render new items
      var items = this.collection.where({ kind: this.options.kind });
      var self = this;

      _(items).each(function(mdl) {
        var item = new cdb.admin.AssetsItem({
          model: mdl
        });
        item.bind('selected', self._selectItem, self);

        self.$('ul').append(item.render().el);
        self.addView(item);
      });

      this._selectLastAsset();

      return this;
    },

    _selectLastAsset: function() {
      var last_kind_asset;

      this.collection.each(function(m) {
        if (m.get('state') === "selected") {
          m.set('state', 'idle');
        }
        
        if (m.get('kind') == this.options.kind) {
          last_kind_asset = m;
        }
      }, this);

      if (last_kind_asset) {
        this.model.set('value', last_kind_asset.get('public_url'));
        last_kind_asset.set('state', 'selected')
      }
    },

    _selectItem: function(m) {
      this.model.set('value', m.get('public_url'));
      this._unselectItems(m);
    },

    // Unselect all images expect the new one 
    _unselectItems: function(m) {
      this.collection.each(function(mdl) {
        if (mdl != m && mdl.get('state') == 'selected') {
          mdl.set('state', 'idle');
        }
      });
    },

    getValue: function() {
      return this.model.get('value');
    }

  });