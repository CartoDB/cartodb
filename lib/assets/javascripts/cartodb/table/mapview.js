/**
* map tab shown in cartodb admin
*/

cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .share a': 'shareMap'
  },

  className: 'map',
  animation_time: 300,

  initialize: function() {
    this.template = this.getTemplate('table/views/maptab');
    this.map = this.model;
    this.map_enabled = false;
    this.featureHovered = null;
    this.infowindowModel = this.options.infowindow;
    this.georeferenced = false;

    //this.add_related_model(this.options.dataLayer);
    this.add_related_model(this.map);
    this.add_related_model(this.options.table);
    this.add_related_model(this.infowindowModel);

    var self = this;

    cdb.god.bind("hidePanel", function(ev) {
      self._moveRightButtons("hide");
    });
    cdb.god.bind("showPanel", function(ev) {
      self._moveRightButtons("show");
    });
    cdb.god.bind("narrowPanel", function(ev) {
      self._moveRightButtons("narrow");
    });

    this.map.bind('change:provider', this.switchMapType, this);
    this.options.table.bind('change:privacy', this._setPrivacy, this);
    this.options.table.bind('change:dataSource', this._hideInfowindow, this);

    this.options.table.bind('data:saved', function() {
      this.updateDataLayerView();
    }, this)

    // menu entries

    this.newGeomDropdown = new cdb.admin.NewGeometryDropdown({
        position: 'position',
        template_base: "table/views/table_new_geom",
        tick: "bottom",
        horizontal_position: "right",
    });
    this.newGeomDropdown.render();

    var addGeom = this.options.menu.addToolButton('add_row', ['mapLite', 'map']);
    $('body').append(this.newGeomDropdown.el);

    this.newGeomDropdown.bind('newGeometry', function(geomType) {
      this.addGeometry(geomType);
    }, this);

    addGeom.bind('click', function(e) {
      if(this.options.table.isGeoreferenced()) {
        this.addGeometry();
      } else {
        var pos = addGeom.$el.offset()
        this.newGeomDropdown.openAt(pos.left - 165, pos.top - 85);
      }
    }, this);


    _.bindAll(this, 'showNoGeoRefWarning');
  },

  clearMap: function() {

    this.mapView.clean();
    this.zoom.clean();
    this.infowindow.clean();

    delete this.mapView;
    delete this.zoom;
    delete this.infowindow;

    this.map_enabled = false;
  },


  /**
   *  Hide the infowindow when a query is applied or cleared
   */
  _hideInfowindow: function() {
    if(this.infowindow) {
      this.infowindow.model.set('visibility', false);
    }
  },


  _setPrivacy: function() {
    if (this.options.table.get('privacy').toLowerCase() != "public") {
      this.$el.find('div.share a').addClass('disabled');
    } else {
      this.$el.find('div.share a').removeClass('disabled');
    }
  },


  /**
  * this function is used when the map library is changed. Each map library
  * works in different way and need to recreate all the components again
  */
  switchMapType: function() {

    if (this.map_enabled) {
      this.clearMap();
      this.render();
      this.enableMap();
    }
  },


  /**
  * map can't be loaded from the beggining, it needs the DOM to be loaded
  * so we wait until is actually shown to create the mapview and show it
  */
  enableMap: function() {

    this.$('.tipsy').remove();
    var self = this;
    if (!this.map_enabled) {
      var div = this.$('#map')
      , base_maps = this.$('.base_maps');

      if (!this.baseLayerChooser) {

        this.baseLayerChooser = new cdb.admin.BaseMapChooser({
          model: this.map,
          baseLayers: this.options.baseLayers
        });

      }

      base_maps.append(this.baseLayerChooser.render().el);

      var mapViewClass = cdb.geo.LeafletMapView;
      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });
      this.retrigger('editInfoWindow', this.mapView);

      this.clickTimeout = null;
      this._bindMissingClickEvents();

      this.map_enabled = true;

      this.mapView.bind('newLayerView', self._bindDataLayer, self);


      // bind data layer if it is already added to the map
      var dataLayer = this.map.get('dataLayer');
      if(dataLayer) {
        var dl = this.mapView.getLayerByCid(self.map.get('dataLayer').cid);
        this._bindDataLayer(dl);
      }


      // Zoom control
      var zoomControl = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: cdb.templates.getTemplate("table/views/zoom_control")
      });
      this.$el.append(zoomControl.render().$el);
      this.zoom = zoomControl;


      // Search control
      var searchControl = new cdb.geo.ui.Search({
        model:    this.map,
        template: cdb.templates.getTemplate("table/views/search_control")
      });
      this.$el.append(searchControl.render().$el);
      this.search = searchControl;


      // Tiles loader
      var tilesLoader = this.loader = new cdb.geo.ui.TilesLoader({
        template: cdb.templates.getTemplate("table/views/tiles_loader")
      });
      this.$el.append(tilesLoader.render().$el);
      // Create tipsy and set to the tiles loader
      tilesLoader.$el.find("div.loader").tipsy({
        title: function() { return "Loading tiles..." },
        fade: true,
        offset: 3,
        gravity: 'w'
      })


      // Zoom info
      var zoomInfo = this.zoomInfo = new cdb.geo.ui.ZoomInfo({
        model: this.map
      });
      this.$el.append(zoomInfo.render().$el);
      // Create tipsy and set to the zoom info element
      zoomInfo.$el.tipsy({
        title: function() { return "Zoom level" },
        fade: true,
        offset: 3,
        gravity: 'w'
      })


      // Infowindow
      self.infowindow = new cdb.admin.MapInfowindow({
        model: self.infowindowModel,
        //template: cdb.templates.getTemplate('table/views/infowindow'),
        mapView: self.mapView,
        table: self.options.table
      });
      self.mapView.$el.append(self.infowindow.el);
      self.retrigger('editInfoWindow', this.infowindow);


      // Editing geometry
      this.geometryEditor = new cdb.admin.GeometryEditor({
        model: this.options.table
      });
      this.geometryEditor.mapView = this.mapView;
      self.mapView.$el.append(self.geometryEditor.render().el);
      this.geometryEditor.hide();

      this.geometryEditor.bind('editStart', this.hideDataLayer, this);
      this.geometryEditor.bind('editDiscard', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.updateDataLayerView, this);
      self.infowindow.bind('editGeom', this.geometryEditor.editGeom, this.geometryEditor);
      self.infowindow.bind('removeGeom', this.updateDataLayerView, this);

      this.options.table.bind('change:dataSource', function() {
        self.geometryEditor.discard();
      });

      this.bindGeoRefCheck();

      // HACK
      // wait a little bit to give time to the mapview
      // to estabilize
      setTimeout(function() {
        self.mapView.setAutoSaveBounds();
      }, 1000);
    }
  },

  bindGeoRefCheck: function() {
    if(!this.options.table.data().fetched) {
      this.options.table.bind('dataLoaded', function() {
        this.checkGeoRef();
      }, this);
    } else {
      this.checkGeoRef();
    }


  },

  activated: function() {

  },

  checkGeoRef: function() {
    if(this.options && this.options.table) {
      if(!this.options.table.isGeoreferenced()) {
        this.trigger('noGeoRef');
        this.showNoGeoRefWarning();
        this.georeferenced = false;
      } else {
        if(!this.georeferenced) {
          this.trigger('geoRef');
        }
        this.georeferenced = true;
        if(this.noGeoRefDialog) {
          this.noGeoRefDialog.hide();
        }
      }
    }
  },

  /**
  * this function binds click and dblclick events
  * in order to not raise click when user does a dblclick
  *
  * it raises a missingClick when the user clicks on the map
  * but not over a feature or ui component
  */
  _bindMissingClickEvents: function() {
    var self = this;
    this.mapView.bind('click', function(e) {
      if(self.clickTimeout === null) {
        self.clickTimeout = setTimeout(function() {
          self.clickTimeout = null;
          if(!self.featureHovered) {
            self.trigger('missingClick');
          }
        }, 150);
      }
      //google maps does not send an event
      if(!self.featureHovered && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    this.mapView.bind('dblclick', function() {
      if(self.clickTimeout !== null) {
        clearTimeout(self.clickTimeout);
        self.clickTimeout = null;
      }
    });
  },

  /**
  * when the layer view is created this method is called
  * to attach all the click events
  */
  _bindDataLayer: function(layer) {
    var self = this;

    var layerType = layer.model.get('type');

    if (layerType === 'CartoDB') { // unbind previos stuff

      if (self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }
      var dataLayer = self.map.get('dataLayer');

      this.options.table.bind('change:schema', function() {
        //dataLayer.invalidate();
      }, this);

      if (dataLayer) {

        var cid = dataLayer.cid;

        self.layerDataView = self.mapView.getLayerByCid(cid);

        if (self.layerDataView) {
          self.layerDataView.bind('featureClick', self.featureClick, self);
          self.layerDataView.bind('featureOut',   self.featureOut,   self);
          self.layerDataView.bind('featureOver',  self.featureOver,  self);
          self.layerDataView.bind('loading',      self.loadingTiles, self);
          self.layerDataView.bind('load',         self.loadTiles,    self);
        }
      }
    }
  },


  loadingTiles: function() {
    this.loader.show()
  },

  loadTiles: function() {
    this.loader.hide()
  },

  featureOver: function(e, latlon, pxPos, data) {
    this.mapView.setCursor('pointer');
    this.featureHovered = data;
  },

  featureOut: function() {
    this.mapView.setCursor('auto');
    this.featureHovered = null;
  },

  featureClick: function(e, latlon, pxPos, data) {
    if(!this.geometryEditor.isEditing()) {
      if(data.cartodb_id) {
        this.infowindow
        .setLatLng(latlon)
        .setFeatureInfo(data.cartodb_id)
        .showInfowindow();
      } else {
        cdb.log.error("can't show infowindow, no cartodb_id on data");
      }
    }
  },

  /**
   *  Move all necessary buttons when panel is openned or closed
   */
  _moveRightButtons: function(type) {
    var right = 0;
    if (type == "show") {
      right = 592;
    } else if (type == "hide") {
      right = 57;
    } else {
      right = 442;
    }

    this.$el.find("div.share")
      .animate({
        right: right
      }, this.animation_time);

    this.$el.find("div.search_box")
      .animate({
        right: right
      }, this.animation_time);
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.template());
    return this;
  },

  shareMap: function(e) {
    e.preventDefault();

    var privacy = this.options.table.get('privacy').toLowerCase()
      , dlg
      , center = false;

    // If the table is not public, we'll show a warning dialog
    if (privacy != 'public') {
      dlg = new cdb.admin.NoShareMapDialog({
        map: this.model,
        table: this.options.table
      });
    } else {
      dlg = new cdb.admin.ShareMapDialog({
        map: this.model,
        table: this.options.table
      });
      center = true;
    }

    dlg.appendToBody().open({ center: center });

    return false;
  },

  addGeometry: function(type) {
    // row is saved by geometry editor if it is needed
    type = type || this.options.table.geomColumnTypes()[0];
    this.geometryEditor.createGeom(this.options.table.data().newRow(), type);
  },

  showDataLayer: function() {
    this.layerDataView.setOpacity(1.0);
  },

  hideDataLayer: function() {
    //this.layerDataView.hide();
    this.layerDataView.setOpacity(0.5);
  },

  /**
  * reload tiles
  */
  updateDataLayerView: function() {
    if(this.layerDataView) {
      this.layerDataView.reload();
    }
  },
  /**
  * Paints a dialog with a warning when the user hasn't any georeferenced row
  * @method showNoGeorefWarning
  */
  showNoGeoRefWarning: function() {
    if(!this.noGeoRefDialog) {
      this.noGeoRefDialog = new cdb.admin.NoGeoRefDataDialog({
        model: this.options.table
      });
      this.retrigger('georeference', this.noGeoRefDialog);
      this.retrigger('manual', this.noGeoRefDialog);
      this.noGeoRefDialog.render().$el.appendTo(this.$el);
    }
    // if the dialog already has been shown, we don't show it again


  }


});

