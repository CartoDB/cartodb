(function() {
/**
 * shows a dialog to share a map view
 * new ExportTableDialog({
 *  table: table_model
 * })
 *
 */
cdb.admin.ShareMapDialog = cdb.admin.BaseDialog.extend({

  events: cdb.core.View.extendEvents({
  }),

  initialize: function() {
    var self = this;

    _.extend(this.options, {
      title: _t("Share your map"),
      description: '',
      template_name: 'table/views/share_map_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Close",
      modal_type: "compressed",
      width: 672,
      modal_class: 'map_share_dialog'
    });

    this.constructor.__super__.initialize.apply(this);
    this.panels = new cdb.ui.common.TabPane();
    this.tabs = new cdb.admin.Tabs();
    this.tabs.linkToPanel(this.panels);
  },


  render_content: function() {
    this.panels.render();
    this.tabs.setElement(this.$('nav'));

    this.panels.addTab('embed', new MapShareTab({
      map: this.options.map,
      table: this.options.table
    }).render());

    var origin = location.origin || location.protocol + "//" + location.host + ":" + location.port + "/";

    this.panels.addTab('url', new UrlShareTab({
      description: 'By sharing this URL people will be able to see your map and your tabular data. <br/>They will not be able to write or edit your data.',
      label: _t("this is the public link to this map"),
      url: origin + this.options.table.embedURL() + "?sql=" + encodeURIComponent(this.options.table.data().getSQL())
    }).render());

    this.panels.addTab('tilejson', new UrlShareTab({
      label: _t("this is the link to the data layer tilejson"),
      url: origin + this.options.map.get('dataLayer').url() + ".tilejson"
    }).render());

    this.panels.bind("tabDisabled", function(tab, child){
      child.setCopy(false);
    });

    this.panels.bind("tabEnabled", function(tab, child) {
      child.setCopy(true);
    });

    //this.addView(this.panels);

    this.panels.active('embed');
    return this.panels.el;
  }
});

var UrlShareTab = cdb.core.View.extend({

  render: function() {
    this.$el.html(this.getTemplate('table/views/map_share_url')(this.options));

    // Tipsy tooltip ready!
    this.$el.find(".zclip")
      .tipsy({
        gravity: 's',
        live: true,
        fade: true,
        title: function() {
          return _t("Copy this");
        }
      });

    return this;
  },

  setCopy: function(active) {
    if (active) {
      this.$el.find("a.copy").zclip({
        path: "/assets/ZeroClipboard.swf",
        copy: function(){
          return $(this).parent().find("p").text();
        }
      });
    } else {
      this.$el.find("a.copy").zclip("remove");
    }
  }
});

var MapShareTab = cdb.core.View.extend({
  initialize: function() {
    var self = this;

    this.mapOptions = new cdb.core.Model({
      title: true,
      description: true,
      search: false,
      shareable: false,
      sql: this.options.table.data().getSQL()
    });

    // do not use the same model than the big map
    this.map = this.options.map.clone();

    this.mapOptions.bind('change', this._setUrl, this);
    this.mapOptions.bind('change', this._changePreview, this);
    this.options.table.bind('change:dataSource', this._setSQL, this);
    this.map.bind('change', function() {
      var bounds = self.mapView.getBounds();
      var c = self.map.get('center');
      self.mapOptions.set({
        sw_lat: bounds[0][0],
        sw_lon: bounds[0][1],
        ne_lat: bounds[1][0],
        ne_lon: bounds[1][1]
        /* lat: c[0], lon: c[1], zoom: self.options.map.getZoom() */
      });
    }, this);
    this.add_related_model(this.options.map);
    this.add_related_model(this.options.table);
  },

  _setSQL: function() {
    this.mapOptions.set({
      sql: this.options.table.data().getSQL()
    });
  },

  // change the map preview showing how it will look
  _changePreview: function() {
    var title = this.mapOptions.get('title')
      , description = this.mapOptions.get('description')
      , shareable = this.mapOptions.get('shareable')
      , search = this.mapOptions.get('search');

    this.$('div.header h1')[title ? 'show':'hide']();
    this.$('div.header p')[description ? 'show':'hide']();
    this.$('div.header div.social')[shareable ? 'show':'hide']();
    this.$('div.search_box')[search ? 'show':'hide']();


    if(!title && !description && !shareable) {
      this.$('div.header').hide();
    } else {
      this.$('div.header').show();
    }

  },

  _setUrl: function() {
    var tableUrl = this.options.table.embedURL()
      , opts =  _.map(this.mapOptions.attributes, function(v, k) {
                  return k + "=" + encodeURIComponent(v);
                })
      , self = this;

    opts = opts.join('&');
    var origin = location.origin || location.protocol + "//" + location.host + ":" + location.port + "/";

    this.$('.url').html(
      "&lt;iframe src='" +
      origin + tableUrl + "?" + opts +
      "'&gt;&lt;/iframe&gt;"
    );

    // Tipsy tooltip ready!
    this.$el.find(".zclip")
      .tipsy({
        gravity: 's',
        live: true,
        fade: true,
        title: function() {
          return _t("Copy this");
        }
      });

    // Prevent url hash error
    this.$el.find("a.tooltip").click(function(ev) {
      ev.preventDefault();
    });
  },

  setCopy: function(active) {
    if (active) {
      var self = this;
      setTimeout(function() { // Hack for ZeroClipboard, it doesn't like effects :S
        self.$el.find("a.copy").zclip({
          path: "/assets/ZeroClipboard.swf",
          copy: function(){
            return $(this).parent().find("p").text();
          }
        })
      },1000);
    } else {
      this.$el.find("a.copy").zclip("remove");
    }
  },

  render: function() {
    var self = this;
    this.$el.html(
      this.getTemplate('table/views/share_map_dialog')({
        title: this.options.table.get('name'),
        description: this.options.table.get('description') || ""
      })
    );

    // map
    // HACK: wait to open
    setTimeout(function() {

      var mapViewClass = cdb.geo.LeafletMapView;
      if(self.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      self.mapView = new mapViewClass({
          el: self.$('.map'),
          map: self.map
      });
      self.addView(self.mapView);
      // trigger this change to set map bounds in the url
      // that are get from mapView
      self.map.trigger('change');
    }, 1000);

    // zoom
    var zoomControl = new cdb.geo.ui.Zoom({
      model:    this.map,
      template: this.getTemplate("table/views/zoom_control")
    });
    self.addView(zoomControl);
    this.$('.map_wrapper').append(zoomControl.render().$el);

    // switchs
    _(['title', 'description', 'search', 'shareable']).each(function(prop) {
      var className = '.' + prop;
      var sw = new cdb.forms.Switch({
        model: self.mapOptions,
        property: prop
      });
      self.addView(sw);

      self.$(className).append(sw.render().el);
    });

    this._setUrl();
    return this;
  }
});

cdb._test = cdb._test || {};
cdb._test.MapShareTab = MapShareTab;

})();
