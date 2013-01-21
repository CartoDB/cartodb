(function() {
/**
 * shows a dialog to share a map view
 * new ShareMapDialog({
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
      width: 750,
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

    // Create map options to use it in the map-share and the url-share
    this.mapOptions = new cdb.core.Model({
      title: true,
      description: true,
      search: false,
      shareable: false,
      cartodb_logo: true,
      sql: this.options.map.get('dataLayer').get('query') || ''
    });


    var origin = 'http://' + location.host;
    var sql = this.options.map.get('dataLayer').get('query') || '';
    var self = this;

    this.panels.addTab('url', new UrlShareTab({
      description: 'By sharing this URL people will be able to see your map and your tabular data. <br/>They will not be able to write or edit your data.',
      label: _t("this is the public link to this map"),
      url: "",
      table: this.options.table,
      mapOptions: this.mapOptions
    }).render());


    this.panels.addTab('embed', new MapShareTab({
      map: this.options.map,
      table: this.options.table,
      user: this.options.user,
      mapOptions: this.mapOptions
    }).render());

    this.panels.addTab('api', new ApiShareTab({
      label: _t("Link to viz json"),
      url: origin + '/api/v1/viz/' + this.options.table.get("id") + '/viz.json'
    }).render());

    this.panels.bind("tabDisabled", function(tab, child){
      child.setCopy(false);
    });

    this.panels.bind("tabEnabled", function(tab, child) {
      self.centerInScreen(true);
      child.setCopy(true);
    });

    //this.addView(this.panels);

    this.panels.active('url');
    return this.panels.el;
  }
});

var UrlShareTab = cdb.core.View.extend({

  _BITLY_LOGIN: 'vizzuality',
  _BITLY_KEY: 'R_de188fd61320cb55d359b2fecd3dad4b',

  render: function() {
    // Add the specific template
    this.$el.html(this.getTemplate('table/views/map_share_url')(this.options));

    // Generate the url
    this.setUrl();

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

  setUrl: function() {
    var self = this;
    var dfd = $.Deferred();
    if(!this.localStorage) this.localStorage = new cdb.admin.localStorage('cartodb_urls');

    var tableUrl = this.options.table.embedURL()
      , opts =  _.map(this.options.mapOptions.attributes, function(v, k) {
                  return k + "=" + encodeURIComponent(v);
                })
      // share urls are always http
      , origin = "http://" + location.host;

    opts = opts.join('&');
    var url = origin + tableUrl + "?" + opts;
    var urlText = 'Generating ...';
    // if we already have retrieved this url, set it. if not, fetch from bitly
    var currentShorcut = this.localStorage.search(url);
    if(currentShorcut) {
      urlText = currentShorcut;
      self.$el.find('input.url').val(urlText);
      this.url = urlText;
      dfd.resolve();
    } else {
      self.$el.find('input.url').val(urlText)
      $.ajax({
        url:"https://api-ssl.bitly.com/v3/shorten?longUrl="+encodeURIComponent(url)+
          "&login="+this._BITLY_LOGIN+"&apiKey="+this._BITLY_KEY,
        type:"GET",
        async: false,
        dataType: 'jsonp',
        success: function(res) {
          urlText = 'http://cdb.io/'+ res.data.hash;
          var obj = {}
          obj[url] = urlText;
          self.localStorage.add(obj);
          this.url = urlText;
        },
        error: function() {
          urlText = url;
        },
        complete: function() {
          self.$el.find('input.url').val(urlText)
          dfd.resolve();
        }
      });
    }
    return dfd.promise();
  },

  setCopy: function(active) {
    var self = this;
    if (active) {
      setTimeout(function() {
        $.when(self.setUrl()).done(function() {
          self.$el.find("a.copy").zclip({
            path: "/assets/ZeroClipboard.swf",
            copy: function(){
              return $(this).parent().find("input").val();
            }
          });
        });
      },500);
    } else {
      this.$el.find("a.copy").zclip("remove");
    }
  }
});


var ApiShareTab = cdb.core.View.extend({

  render: function() {
    // Add the specific template
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
          return $(this).parent().find("input").val();
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

    this.mapOptions = this.options.mapOptions;

    // do not use the same model than the big map
    this.map = this.options.map.clone();

    this.mapOptions.bind('change', this._setUrl, this);
    this.mapOptions.bind('change', this._changePreview, this);
    this.options.table.bind('change:dataSource', this._setSQL, this);
    this.map.bind('change', this._changeBounds, this);
    this.add_related_model(this.options.map);
    this.add_related_model(this.options.table);
  },

  _setSQL: function() {
    var sql = this.options.map.get('dataLayer').get('query') || '';
    this.mapOptions.set({
      sql: sql
    });
  },

  _changeBounds: function() {
    var self = this;
    var bounds = self.map.getViewBounds();
    if(bounds) {
      if(self.map.getZoom() <= 3) {
          self.mapOptions
            .unset('sw_lat')
            .unset('sw_lon')
            .unset('ne_lat')
            .unset('ne_lon')
          var c = self.map.get('center');
          self.mapOptions.set({
            zoom: self.map.getZoom(),
            center_lat: c[0],
            center_lon: c[1]
          });
      } else {
        self.mapOptions
            .unset('zoom')
            .unset('center_lon')
            .unset('center_lat')
        self.mapOptions.set({
          sw_lat: bounds[0][0],
          sw_lon: bounds[0][1],
          ne_lat: bounds[1][0],
          ne_lon: bounds[1][1]
        });
      }
    }
  },

  // change the map preview showing how it will look
  _changePreview: function() {
    var title = this.mapOptions.get('title')
      , description = this.mapOptions.get('description')
      , shareable = this.mapOptions.get('shareable')
      , search = this.mapOptions.get('search')
      , cartodb_logo = this.mapOptions.get('cartodb_logo');

    this.$('div.header h1')[title ? 'show':'hide']();
    this.$('div.header p')[description ? 'show':'hide']();
    this.$('div.header div.social')[shareable ? 'show':'hide']();
    this.$('div.search_box')[search ? 'show':'hide']();
    this.$('a.cartodb_logo')[cartodb_logo ? 'show':'hide']();

    if(!title && !description && !shareable) {
      this.$('div.header').hide();
    } else {
      this.$('div.header').show();
    }

    // Check map position if the properties change
    this._setMapPosition();
  },

  _setUrl: function() {
    var tableUrl = this.options.table.embedURL()
      , opts =  _.map(this.mapOptions.attributes, function(v, k) {
                  return k + "=" + encodeURIComponent(v);
                })
      , self = this;

    opts = opts.join('&');
    var origin = "http://" + location.host;

    this.$('input.url').val(
      "<iframe width='400' height='400' frameborder='0' src='" +
      origin + tableUrl + "?" + opts +
      "'></iframe>"
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
            return $(this).parent().find("input").val();
          }
        })
      },1000);
    } else {
      this.$el.find("a.copy").zclip("remove");
    }
  },


  deactivated: function() {
    if(this.mapView) {
      this.mapView.clean(); 
      this.mapView = null;
    }
    this.visible = false;
  },

  activated: function() {
    var self = this;
    if(self.mapView) return;

    this.visible = true;

    // map
    // HACK: wait to open
    setTimeout(function() {
      if(!self.visible) return;
      var mapViewClass = cdb.geo.LeafletMapView;
      if(self.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      var el = $('<div>').addClass('map');
      this.$('.map_wrapper').prepend(el);

      self.mapView = new mapViewClass({
          el: el,
          map: self.map
      });
      self.addView(self.mapView);
      // trigger this change to set map bounds in the url
      // that are get from mapView
      self.map.trigger('change');
    }, 300);

  },

  render: function() {
    var self = this;

    this.$el.html(
      this.getTemplate('table/views/share_map_dialog')({
        title: this.options.table.get('name'),
        description: this.options.table.get('description') || "",
        special_user: (this.options.user.account_type != "FREE" && !config.custom_com_hosted)
      })
    );

    // zoom
    var zoomControl = new cdb.geo.ui.Zoom({
      model:    this.map,
      template: this.getTemplate("table/views/zoom_control")
    });
    self.addView(zoomControl);
    this.$('.map_wrapper').append(zoomControl.render().$el);

    // search
    var searchControl = new cdb.geo.ui.Search({
      model:    this.map,
      template: this.getTemplate("table/views/search_control")
    });
    self.addView(searchControl);
    this.$('.map_wrapper').append(searchControl.render().$el);

    // switchs
    _(['title', 'description', 'search', 'shareable', 'cartodb_logo']).each(function(prop) {
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
  },

  // Don't positionate the map below the header, just check
  // if it is visible or not and then calculate the necessary px
  _setMapPosition: function() {
    var header_h = this.$('div.header').is(":visible")
      ? this.$('div.header').outerHeight()
      : 0;

    this.$("div.map").css({
      top: header_h
    });
  }
});

cdb._test = cdb._test || {};
cdb._test.MapShareTab = MapShareTab;

})();
