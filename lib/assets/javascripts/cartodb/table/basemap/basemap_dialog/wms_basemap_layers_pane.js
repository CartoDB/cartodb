
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

    template_base: '<div class="msg"><strong><%= name %></strong><% if (!valid) { %><p>It doesn\'t contain supported projections (3857, 900913)</p><% } %></div> <a href="#add_this" class="button grey smaller right<% if (!valid) { %> disabled<% } %>">Add this</a>',

    events: {
      'click a.button'   : "_onClickLayer"
    },

    initialize: function() {
      this.template = _.template(this.template_base);
    },

    _onClickLayer: function(e) {

      e.preventDefault(e);
      e.stopPropagation(e);

      var self = this;

      if ($(e.target).hasClass("disabled")) return;

      var name = this.model.get("name") || this.model.get("title");

      var className;

      if (name && parseInt(name) && _.isNumber(parseInt(name))) {
        name = "w" + name;
      }

      className = name.replace(/default/g, '').replace(/\s+/g, '').replace(/[^a-zA-Z_0-9 ]/g, "").toLowerCase();

      var w = new cdb.admin.WMSService({
        wms_url:  this.options.url,
        layer:    this.model.get("name"),
        srs:      this.model.get("srs")
      });

      w.save({},{
        success: function(m) {
          if (m.get('mapproxy_id')) {

            var urlTemplate = m.getProxyTiles();
            var layer = new cdb.admin.TileLayer({
              urlTemplate:  urlTemplate,
              attribution:  m.get('attribution') || null,
              maxZoom:      21,
              minZoom:      0,
              name:         m.get("layer") || m.get("title") || m.get("name"),
              proxy:        true
            });

            var name = layer._generateClassName(urlTemplate);

            self.trigger('layer_choosen', layer, name);
          }
        }
      });

    },

    render: function() {
      var options = _.extend(this.model.toJSON(), { valid : true });
      this.$el.html(this.template(options));

      if (!this.valid) this.$el.addClass("invalid");

      return this;
    }

  });



  cdb.admin.WMSBasemapLayersPane = cdb.core.View.extend({

    className: "basemap-pane",

    initialize: function() {

      var self = this;

      this.template = this.options.template || cdb.templates.getTemplate('table/views/basemap/basemap_chooser_wms_pane');

      this._loadLayers(this.options.layers);

      this.render();

      var invalidCount = 0;

      this.items.each(function(layer) {

        var view = new cdb.admin.WMSBasemapLayersPaneItemView({
          model: layer,
          url: self.options.url
        });

        self.$el.find("ul").append(view.render().$el);
        self.addView(view);

        if (!view.valid) invalidCount++;

        view.bind("layer_choosen", function(layer) {
          self.trigger('successChooser', layer, "wms_name");
        });

      });

      setTimeout(function() {
        self.trigger("enableBack", this);
      }, 200);

    },

    checkTileJson: function() {},

    _loadLayers: function(layers) {

      var items = _.map(layers, function(item) {

        return new cdb.admin.WMSBasemapLayersPaneItem({
          name: item.name,
          title: item.title,
          srs: item.srs,
          crs: item.crs,
          bounding_boxes: item.bounding_boxes
        });

      });

      this.items = new cdb.admin.WMSBasemapLayersPaneItems(items);

    },

    _hideLoader: function() {},
    _hideError: function() {},

    render: function() {
      this.$el.html(this.template({ layers: this.options.layers }));
      return this;
    }
  });
