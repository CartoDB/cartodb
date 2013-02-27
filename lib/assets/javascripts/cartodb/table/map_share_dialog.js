(function() {
/**
 * shows a dialog to share a map view
 * new ShareMapDialog({
 *  table: table_model
 * })
 *
 */
cdb.admin.ShareMapDialog = cdb.admin.BaseDialog.extend({

  _BITLY_LOGIN: 'vizzuality',
  _BITLY_KEY: 'R_de188fd61320cb55d359b2fecd3dad4b',

  events: cdb.core.View.extendEvents({
    'click a' : '_onMethodClick'
  }),

  _updateURL: function(obj, url) {
    this.$el.find('input.url').val(url);
  },

  _updateSelectedOption: function(obj, method) {

    this.$el.find(".copy .input ul li.selected").removeClass("selected");
    this.$el.find(".copy .input ul li a[data-method='" + method + "']").parent().addClass("selected");

    console.log(method);

    if (method == "url") {
      this.setUrl();
    }
    else if (method == "embed") {
      var url = this.mapShare._setUrl();
      this.model.set("url", url);
    }
    else if (method == "api") {
      var url = this.origin + '/api/v1/viz/' + this.options.table.get("id") + '/viz.json';
      this.model.set("url", url);
    }

  },

  initialize: function() {
    var self = this;

    this.model      = new cdb.core.Model();
    this.model.bind('change:url',    this._updateURL, this);
    this.model.bind('change:method', this._updateSelectedOption, this);

    this.options = _.extend({
      title: _t("Publish your visualization"),
      description: '',
      template_name: 'table/views/share_map_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Close",
      modal_type: "compressed",
      width: 750,
      modal_class: 'map_share_dialog'
    }, this.options);


    // Create map options to use it in the map-share and the url-share
    this.mapOptions = new cdb.core.Model({
      title: true,
      description: true,
      search: false,
      shareable: false,
      cartodb_logo: true,
      sql: this.options.map.get('dataLayer').get('query') || ''
    });


    // Do not use the same model than the big map
    this.map = this.options.map.clone();

    // Show CartoDB logo in this case
    this.map.layers.map(function(layer) {
      if (layer.get('cartodb_logo') == false)
        layer.set('cartodb_logo', true);
    });

    this.mapOptions.bind('change', this._setUrl, this);
    this.mapOptions.bind('change', this._changePreview, this);
    this.options.table.bind('change:dataSource', this._setSQL, this);
    this.map.bind('change', this._changeBounds, this);
    this.add_related_model(this.options.map);
    this.add_related_model(this.options.table);


    this.constructor.__super__.initialize.apply(this);

  },

  render_content: function() {

    var self   = this;

    this.origin = 'http://' + location.host;
    this.sql    = this.options.map.get('dataLayer').get('query') || '';

    this.setCopy(true);

    this.model.set("method", "url");

    return this._renderMap();
  },


  _renderMap: function() {
  var self = this;

    this.$el.html(
      this.getTemplate('table/views/share_map_dialog')({
        title: this.options.table.get('name'),
        description: this.options.table.get('description') || "",
        special_user: (this.options.user.account_type.toLowerCase() == "coronelli" && !config.custom_com_hosted)
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

    return this.el;

  },

  _onMethodClick: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var $link = $(e.target);
    var method = $link.attr("data-method");

    this.model.set("method", method);
  },

  setCopy: function(active) {
    var self = this;

    setTimeout(function() { // Hack for ZeroClipboard, it doesn't like effects :S
      self.$el.find("a.copy").zclip({
        path: "/assets/ZeroClipboard.swf",
        copy: function(){
          return $(this).parent().find("input").val();
        }
      })
    }, 1000);


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

  setUrl: function() {
    var self = this;

    if (!this.localStorage) this.localStorage = new cdb.admin.localStorage('cartodb_urls');

    var
    tableUrl = this.options.table.embedURL(),
    opts     =  _.map(this.mapOptions.attributes, function(v, k) {
      return k + "=" + encodeURIComponent(v);
    }),
    origin = "http://" + location.host; // share urls are always http

    opts = opts.join('&');

    var url = origin + tableUrl + "?" + opts;

    // if we already have retrieved this url, set it. if not, fetch from bitly
    var currentShorcut = this.localStorage.search(url);

    if (currentShorcut) {
      this.model.set("url", currentShorcut);
    } else {
      this.requestShortURL(url);
    }

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

    var url = "<iframe width='400' height='400' frameborder='0' src='" +
      origin + tableUrl + "?" + opts +
      "'></iframe>";

    return url;
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

  // Don't positionate the map below the header, just check
  // if it is visible or not and then calculate the necessary px
  _setMapPosition: function() {
    var header_h = this.$('div.header').is(":visible")
    ? this.$('div.header').outerHeight()
    : 0;

    this.$("div.map").css({
      top: header_h
    });
  },

  requestShortURL: function(url) {
    var self = this;
    console.log('requesting url for', url);

    this.model.set("url", 'Generating...');

    $.ajax({
      url:"https://api-ssl.bitly.com/v3/shorten?longUrl=" + encodeURIComponent(url)+ "&login=" + this._BITLY_LOGIN + "&apiKey=" + this._BITLY_KEY,
      type:"GET",
      async: false,
      dataType: 'jsonp',

      success: function(res) {
        console.log('success');
        urlText = 'http://cdb.io/'+ res.data.hash;
        var obj = {}
        obj[url] = urlText;
        self.localStorage.add(obj);
      },

      error: function() {
        console.log(url);
        urlText = url;
      },

      complete: function() {
        console.log('complete');
        self.model.set("url", urlText);
        //dfd.resolve();
      }
    });

  }

});

cdb._test = cdb._test || {};

})();
