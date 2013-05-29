/**
* map tab shown in cartodb admin
*/

cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .sqlview .clearview':    '_clearView',
    'click .sqlview .export_query': '_tableFromQuery'
  },

  className: 'map',
  animation_time: 300,

  initialize: function() {
    this.template = this.getTemplate('table/views/maptab');
    this.map = this.model;
    this.map_enabled = false;
    this.featureHovered = null;
    this.georeferenced = false;
    this.activeLayerView = null;

    this.add_related_model(this.map);

    var self = this;

    // Actions triggered in the right panel
    cdb.god.bind("panel_action", function(action) {
      self._moveInfo(action);
    }, this);

    this.add_related_model(cdb.god);

    this.map.bind('change:provider', this.switchMapType, this);

    _.bindAll(this, 'showNoGeoRefWarning');
  },

  deactivated: function() {
    if(this.map_enabled) {
      this.clearMap();
    }
  },

  clearMap: function() {
    clearTimeout(this.autoSaveBoundsTimer);
    this.mapView.clean();
    this.basemapDropdown.clean();
    this.zoom.clean();
    if(this.infowindow) {
      this.infowindow.clean();
    }
    if(this.geometryEditor) this.geometryEditor.clean();
    if(this.table) {
      this.table.unbind(null, null, this);
    }

    delete this.mapView;
    delete this.basemapDropdown;
    delete this.zoom;
    delete this.infowindow;
    delete this.geometryEditor;

    this.map_enabled = false;

    // place the map DOM object again
    this.render();
  },


  /**
   *  Hide the infowindow when a query is applied or cleared
   */
  _hideInfowindow: function() {
    if(this.infowindow) {
      this.infowindow.model.set('visibility', false);
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

      var div = this.$('.cartodb-map');

      var mapViewClass = cdb.geo.LeafletMapView;

      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });

      this.clickTimeout = null;
      this._bindMissingClickEvents();

      this.map_enabled = true;

      //this.mapView.bind('newLayerView', self._bindDataLayer, self);

      // bind data layer if it is already added to the map
      /*var dataLayer = this.map.get('dataLayer');
      if(dataLayer) {
        var dl = this.mapView.getLayerByCid(self.map.get('dataLayer').cid);
        this._bindDataLayer(dl);
      }*/


      // Create Base Layer chooser
      if (!this.basemapDropdown) {

        this.basemapDropdown = new cdb.admin.DropdownBasemap({
          target: $('.basemap_dropdown'),
          position: "position",
          template_base: "common/views/dropdown_basemap",
          model: this.map,
          mapview: this.mapView,
          baseLayers: this.options.baseLayers,
          tick: "left",
          horizontal_position: "left",
          horizontal_offset: "40px"
        });

        this.addView(this.basemapDropdown);

        cdb.god.bind("closeDialogs", this.basemapDropdown.hide, this.basemapDropdown);

        $(".basemap_dropdown").append(this.basemapDropdown.render().el);
      }

      // Set active base layer if it already exists
      if (this.map.getBaseLayer()) {
        this.basemapDropdown.setActiveBaselayer();
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
      });

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
      });

      this._addInfowindow();

      this.mapView.bind('newLayerView', function(layerView) {
        if(this.activeLayerView && layerView.model.cid == this.activeLayerView.model.cid) {
          this._bindDataLayer(this.activeLayerView);
        }
      }, this);

      if(this.activeLayerView) {
        this._bindDataLayer(this.activeLayerView);
      }

      // HACK
      // wait a little bit to give time to the mapview
      // to estabilize
      this.autoSaveBoundsTimer = setTimeout(function() {
        self.mapView.setAutoSaveBounds();
      }, 1000);
    }
  },

  bindGeoRefCheck: function() {
    if(!this.table.data().fetched) {
      this.table.bind('dataLoaded', function() {
        this.checkGeoRef();
      }, this);
    } else {
      this.checkGeoRef();
    }
  },

  activated: function() {
    $(window).scrollTop(0);
  },

  checkGeoRef: function() {
    if(this.options && this.table) {
      if(!this.table.isGeoreferenced()) {
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

  setActiveLayer: function(layerView) {
    this.activeLayerView = layerView;
    // check if the map is rendered and the layer is in the map
    if(this.mapView && this.mapView.getLayerByCid(layerView.model.cid)) {
      this._bindDataLayer(layerView);
    }
  },

  /**
  * when the layer view is created this method is called
  * to attach all the click events
  */
  _bindDataLayer: function(layerView) {
    var self = this;
    var layer = layerView.model;
    var layerType = layer.get('type');

    if (layerType === 'CartoDB') { // unbind previos stuff

      // Set data layer bindings
      if (self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }
      self.infowindowModel = layer.infowindow;
      self._bindTable(layer.table);
      self._bindSQLView(layer.sqlView);
      self.layerDataView = self.mapView.getLayerByCid(layer.cid);

      if (self.layerDataView) {
        self.layerDataView.bind('featureClick', self.featureClick, self);
        self.layerDataView.bind('featureOut',   self.featureOut,   self);
        self.layerDataView.bind('featureOver',  self.featureOver,  self);
        self.layerDataView.bind('loading',      self.loadingTiles, self);
        self.layerDataView.bind('load',         self.loadTiles,    self);
      }

      // Set layer model binding
      if (layerView && layerView.model) {
        layerView && layerView.model.unbind('startEdition',this._addGeometry, this);
        layerView.model.bind('startEdition', this._addGeometry, this);
      }
    }
  },

  _addInfowindow: function() {
    if(this.infowindow) this.infowindow.clean();
    if(this.table && this.mapView) {
      this.infowindow = new cdb.admin.MapInfowindow({
        model: this.infowindowModel,
        mapView: this.mapView,
        table: this.table
      });
      this.mapView.$el.append(this.infowindow.el);

      // Editing geometry
      if(this.geometryEditor) this.geometryEditor.clean();

      this.geometryEditor = new cdb.admin.GeometryEditor({
        model: this.table
      });

      this.geometryEditor.mapView = this.mapView;
      this.mapView.$el.append(this.geometryEditor.render().el);
      this.geometryEditor.hide();

      this.geometryEditor.bind('editStart', this.hideDataLayer, this);
      this.geometryEditor.bind('editDiscard', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.updateDataLayerView, this);
      this.geometryEditor.bind('geomCreated', function(row) {
        this.table.data().add(row);
      }, this);

      this.infowindow.bind('editGeom', this.geometryEditor.editGeom, this.geometryEditor);
      this.table.bind('remove:row', this.updateDataLayerView, this);

      this.table.bind('change:dataSource', function() {
        this.geometryEditor.discard();
      }, this);
    }
  },

  _addGeometry: function(type) {
    this.geometryEditor.createGeom(this.table.data().newRow(), type);
  },

  _bindTable: function(table) {
    
    if(this.table) {
      this.table.unbind(null, null, this);
    }
    this.table = table;

    this.table.bind('change:dataSource', this._hideInfowindow, this);
    this.table.bind('change:dataSource', this._updateSQLHeader, this);

    this.table.bind('data:saved', function() {
      this.updateDataLayerView();
    }, this);


    this.table.bind('change:schema', function() {
      //dataLayer.invalidate();
    }, this);

    // infowindow
    this._addInfowindow();

    this.bindGeoRefCheck();
  },

  _bindSQLView: function(sqlView) {
    if(this.sqlView) {
      this.sqlView.unbind(null, null, this);
    }
    this.sqlView = sqlView;
    this.sqlView.bind('reset error', this._updateSQLHeader, this);
  },

  _updateSQLHeader: function() {
    if(this.table.isInSQLView()) {
      this._addSQLViewHeader();
    } else {
      this._removeSQLViewHeader();
    }
  },


  loadingTiles: function() {
    this.loader.show()
  },

  loadTiles: function() {
    this.loader.hide()
  },

  featureOver: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('pointer');
    this.featureHovered = data;
  },

  featureOut: function() {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('auto');
    this.featureHovered = null;
  },

  featureClick: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
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
   *  Move all necessary blocks when panel is openned (normal, narrowed,...) or closed
   */
  _moveInfo: function(type) {
    if (type == "show") {
      this.$el
        .removeClass('narrow')
        .addClass('displaced');
    } else if (type == "hide") {
      this.$el.removeClass('narrow displaced');
    } else if (type == "narrow") {
      this.$el.addClass('narrow displaced');
    }
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.template());
    return this;
  },

  showDataLayer: function() {
    this.layerDataView.setInteraction(true);
    this.layerDataView.setOpacity(1.0);
  },

  hideDataLayer: function() {
    //this.layerDataView.hide();
    this.layerDataView.setInteraction(false);
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
    var warningStorageName = '';
    if(this.table.data().length > 0) {
      warningStorageName = 'georefContentWarningShowed' + this.table.id;
    } else {
      warningStorageName = 'georefNoContentWarningShowed' + this.table.id;
    }

    if(!this.noGeoRefDialog && !this.table.isInSQLView() && (!localStorage[warningStorageName])) {
      localStorage[warningStorageName] = true;
      this.noGeoRefDialog = new cdb.admin.NoGeoRefDataDialog({
        model: this.table
      });
      this.retrigger('georeference', this.noGeoRefDialog);
      this.retrigger('manual', this.noGeoRefDialog);
      this.noGeoRefDialog.render().$el.appendTo(this.$el);
    }
    // if the dialog already has been shown, we don't show it again
  },

  //adds the green indicator when a query is applied
  _addSQLViewHeader: function() {
    this.$('.sqlview').remove();
    var total = this.table.data().size();
    var html = this.getTemplate('table/views/sql_view_notice')({
      empty: !total
    });
    this.$('.cartodb-map').after(html);
  },

  _removeSQLViewHeader: function() {
    this.$('.sqlview').remove();
  },

  _clearView: function(e) {
    this.killEvent(e);
    this.activeLayerView.model.clearSQLView();
    return false;
  },

  _tableFromQuery: function(e) {
    this.killEvent(e);

    var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
      model: this.table
    });
    duplicate_dialog.appendToBody().open();
  }

});


