
  /**
   *  WMS layers pane for basemap chooser
   */

  cdb.admin.WMSBasemapLayersPaneItem = cdb.core.Model.extend({
  });

  cdb.admin.WMSBasemapLayersPaneItems = Backbone.Collection.extend({
    model: cdb.admin.WMSBasemapLayersPaneItem
  });

  cdb.admin.WMSBasemapLayersPaneItemView = cdb.core.View.extend({

    tagName: "li",

    template_base: '<div class="msg"><strong><%- name %></strong></div> <a href="#/add-this" class="button grey smaller right">Add this</a>',

    events: {
      'click a.button'   : "_onClickLayer"
    },

    initialize: function() {
      this.template = _.template(this.template_base);
    },

    _onClickLayer: function(e) {
      this.killEvent(e);

      var self = this;

      var d = {
        wms_url:        this.options.url,
        layer:          this.model.get("name"),
        srs:            this.model.get("srs"),
        title:          this.model.get("title"),
        name:           this.model.get("name"),
        bounding_boxes: this.model.get("bounding_boxes")
      }

      var w = new cdb.admin.WMSService(d);

      // TODO: remove mixpanel
      cdb.god.trigger('mixpanel', "WMS layer selected", d);

      // Event tracking "WMS layer selected"
      cdb.god.trigger('metrics', 'select_wms', {
        email: window.user_data.email,
        data: d
      });

      this.trigger('layer_selected');

      w.save({},{
        success: function(m) {
          var layer;
          try {
            layer = m.newTileLayer();
          } catch(err) {
          }
          if (layer) {
            var className = layer._generateClassName(layer.get('urlTemplate'));
            self.trigger('layer_choosen', layer, className);
          }
        }
      });

    },

    render: function() {
      var options = this.model.toJSON();
      this.$el.html(this.template(options));
      return this;
    }

  });



  cdb.admin.WMSBasemapLayersPane = cdb.core.View.extend({

    className: "basemap-pane",

    initialize: function() {

      var self = this;

      _.bindAll(this, '_showLoader');

      this.template = this.options.template || cdb.templates.getTemplate('table/views/basemap/basemap_chooser_wms_pane');

      this._loadLayers(this.options.layers);

      this.render();

      setTimeout(function() {
        self.trigger("enableBack", this);
      }, 200);
    },

    checkTileJson: function() {},

    _loadLayers: function(layers) {
      var items = _.map(layers, function(item) {
        return new cdb.admin.WMSBasemapLayersPaneItem({
          name:           item.name,
          title:          item.title,
          srs:            item.srs,
          crs:            item.crs,
          bounding_boxes: item.llbbox
        });

      });

      this.items = new cdb.admin.WMSBasemapLayersPaneItems(items);
    },

    _hideLoader: function() {},
    _hideError: function() {},

    _showLoader: function() {
      this.$el.append(cdb.templates.getTemplate('table/views/basemap/basemap_chooser_wms_proxy_loader')());
      this.$('.basemap_chooser_wms_items').hide();
    },

    render: function() {

      this.clearSubViews();

      this.$el.html(this.template({ layers: this.options.layers }));

      var self = this;
      this.items.each(function(layer) {

        var view = new cdb.admin.WMSBasemapLayersPaneItemView({
          model: layer,
          url: self.options.url
        });

        self.$("ul").append(view.render().$el);
        self.addView(view);

        view.bind('layer_selected', self._showLoader, this);
        view.bind("layer_choosen", function(layer) {
          self.trigger('successChooser', layer, "wms_name");
        });

      });

      return this;
    }
  });
