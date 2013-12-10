/**
* map tab shown in cartodb admin
*/

/**
 * inside the UI all the cartodb layers should be shown merged.
 * the problem is that the editor needs the layers separated to work
 * with them so this class transform from multiple cartodb layers
 * and create only a view to represent all merged in a single layer group
 */
function GrouperLayerMapView(mapViewClass) {

  return {

    initialize: function() {
      this.groupLayer = null;
      this.activeLayerModel = null;
      mapViewClass.prototype.initialize.call(this);
    },

    _removeLayers: function() {
      var self = this;
      _.each(this.map.layers.getLayersByType('CartoDB'), function(layer) {
        layer.unbind(null, null, self);
      });
      cdb.geo.MapView.prototype._removeLayers.call(this);
      if(this.groupLayer) {
        this.groupLayer.model.unbind();
      }
      this.groupLayer = null;
    },

    _removeLayer: function(layer) {
      // if the layer is in layergroup
      if(layer.cid in this.layers) {
        if(this.layers[layer.cid] === this.groupLayer) {
          this._updateLayerDefinition(layer);
          layer.unbind(null, null, this);
          delete this.layers[layer.cid];
        } else {
          cdb.geo.MapView.prototype._removeLayer.call(this, layer);
        }
      } else {
        cdb.log.info("removing non existing layer");
      }
    },

    setActiveLayer: function(layer) {
      this.activeLayerModel = layer;
      this._setInteraction();
    },

    // set interaction only for the active layer
    _setInteraction: function() {
      if(!this.groupLayer) return;
      if(this.activeLayerModel) {
        this.groupLayer._clearInteraction();
        var idx = this.map.layers.getLayerDefIndex(this.activeLayerModel);
        // when layer is not found idx == -1 so the interaction is 
        // disabled for all the layers
        for(var i = 0; i < this.groupLayer.getLayerCount(); ++i) {
          this.groupLayer.setInteraction(i, i == idx);
        }
      }
    },


    _updateLayerDefinition: function(layer) {
      if(!layer) throw "layer must be a valid layer (not null)";
      if(this.groupLayer) {
        // the extra_params attributes sent to the server
        // differs of the one is stored in local so every time
        // the model is saved backbone raises a change event.
        //
        // In order to no update the layer more than 1 time per update
        // dont update it when *only* extra_params is changed
        if(!(_.size(layer.changed) == 1 && layer.changed.extra_params)) {
          var def = this.map.layers.getLayerDef();
          this.groupLayer.setLayerDefinition(def);
          this._setInteraction();
        }
      }
    },

    /**
     * when merged layers raises an error this function send the error to the
     * layer that actually caused it
     */
    _routeErrors: function(errors) {
      var styleRegExp = /style(\d+)/;
      var postgresExp = /PSQL error/i;
      var layers = this.map.layers.where({ visible: true, type: 'CartoDB' });
      for(var i in errors) {
        var err = errors[i];
        // filter empty errors
        if(err && err.length) {
          var match = styleRegExp.exec(err);
          if(match) {
            var layerIndex = parseInt(match[1], 10);
            layers[layerIndex].trigger('parseError', [err]);
          } else {
            if(postgresExp.exec(err)) {
              _.each(layers, function(lyr) {
                if(err.indexOf(lyr.get('query')) != -1) {
                  var e = err.split('\n');
                  if(e.length >= 2) {
                    e = e[1];
                  } else {
                    e = err;
                  }
                  lyr.trigger('parseError', [e]);
                }
              });

            } else {
            _.each(layers, function(lyr) { lyr.trigger('error', err); });
            }
          }
        }
      }
    },

    _routeSignal: function(signal) {
      var self = this;
      return function() {
        var layers = self.map.layers.where({ visible: true, type: 'CartoDB' });
        var args = [signal].concat(arguments);
        _.each(layers, function(lyr) { lyr.trigger.apply(lyr, args); });
      }
    },

    _addLayer: function(layer, layers, opts) {

      // create group layer to acumulate cartodb layers
      if (layer.get('type') === 'CartoDB') {
        var self = this;
        if(!this.groupLayer) {
          // create model
          var m = new cdb.geo.CartoDBGroupLayer(layer.toLayerGroup());
          var layer_view = mapViewClass.prototype._addLayer.call(this, m, layers, _.extend({}, opts, { silent: true }));
          delete this.layers[m.cid];
          this.layers[layer.cid] = layer_view;
          this.groupLayer = layer_view;
          m.bind('error', this._routeErrors, this);
          m.bind('tileOk', this._routeSignal('tileOk'), this);
          this.trigger('newLayerView', layer_view, layer, this);
        } else {
          this.layers[layer.cid] = this.groupLayer;
          this._updateLayerDefinition(layer);
          this.trigger('newLayerView', this.groupLayer, layer, this);
        }
        /*layer.bind('change:type', function () {
          if (layer.get('type') !== 'CartoDB') {
            this._updateLayerDefinition(layer);
            layer.unbind(null, null, this);
            delete this.layers[layer.cid];
          }
        }, this);
        */
        layer.bind('change', this._updateLayerDefinition, this);
      } else {
        mapViewClass.prototype._addLayer.call(this, layer, layers, opts);

      }
    }
  }
};

cdb.admin.LeafletMapView = cdb.geo.LeafletMapView.extend(GrouperLayerMapView(cdb.geo.LeafletMapView));
cdb.admin.GoogleMapsMapView = cdb.geo.GoogleMapsMapView.extend(GrouperLayerMapView(cdb.geo.GoogleMapsMapView));


cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .sqlview .clearview':    '_clearView',
    'click .sqlview .export_query': '_tableFromQuery'
  },

  _TEXTS: {
    no_interaction_warn: _t("Map interaction is disabled, select cartodb_id to enable it")
  },

  className: 'map',
  animation_time: 300,

  initialize: function() {
    this.template = this.getTemplate('table/views/maptab');
    this.map = this.model;
    this.user = this.options.user;
    this.vis = this.options.vis;
    this.map_enabled = false;
    this.featureHovered = null;
    this.georeferenced = false;
    this.activeLayerView = null;
    this.layerDataView = null;
    this.layerModel = null;

    this.add_related_model(this.map);
    this.add_related_model(this.map.layers);

    var self = this;

    // Actions triggered in the right panel
    cdb.god.bind("panel_action", function(action) {
      self._moveInfo(action);
    }, this);

    this.add_related_model(cdb.god);

    this.map.bind('change:provider', this.switchMapType, this);

    this.map.layers.bind('change:visible', this._addLegends, this);
    this.map.layers.bind('change:visible', this._addTimeline, this);
    this.map.layers.bind('remove reset',   this._addLegends, this);
    this.map.layers.bind('remove reset',   this._addTimeline, this);

    this.legends = [];

    _.bindAll(this, 'showNoGeoRefWarning');

  },

  isMapEnabled: function() {
    return this.map_enabled;
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

    if (this.infowindow) {
      this.infowindow.clean();
    }

    this._cleanLegends();

    if (this.stackedLegend) {
      this.stackedLegend.clean();
    }

    if(this.timeline) {
      this.timeline.clean();
      this.timeline = null;
    }

    if(this.geometryEditor) this.geometryEditor.clean();

    if(this.table) {
      this.table.unbind(null, null, this);
    }

    delete this.mapView;
    delete this.basemapDropdown;
    delete this.zoom;
    delete this.infowindow;
    delete this.legends;
    delete this.legend;
    delete this.stackedLegend;
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

      //var mapViewClass = cdb.geo.LeafletMapView;
      var mapViewClass = cdb.admin.LeafletMapView;

      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.admin.GoogleMapsMapView;
      }

      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });

      this.clickTimeout = null;
      this._bindMissingClickEvents();

      this.map_enabled = true;

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

      this.mapView.bind('newLayerView', function(layerView, model) {
        if(this.activeLayerView && this.activeLayerView.model.id == model.id) {
          this._bindDataLayer(this.activeLayerView, model);
        }
      }, this);

      if (this.activeLayerView) {
        this._bindDataLayer(this.activeLayerView, this.activeLayerView.model);
      }

      this._addLegends();

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
    if(this.options && this.table && !this.vis.isVisualization()) {
      if(!this.table.isGeoreferenced()) {
        this.showNoGeoRefWarning();
        this.georeferenced = false;
      } else {
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
      var layerModel = layerView.model;
      this._bindDataLayer(layerView, layerModel);
    }
  },

  /**
  * when the layer view is created this method is called
  * to attach all the click events
  */
  _bindDataLayer: function(layerView, layer) {
    var self = this;
    var layerType = layer.get('type');

    if (layerType === 'CartoDB' || layerType === 'torque') { // unbind previos stuff

      // Set data layer bindings
      if (self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }

      if (self.layerModel) {
        self.layerModel.unbind(null, null, this);
      }

      if (self.options.geocoder) {
        self.options.geocoder.unbind(null, null, this);
      }

      self.infowindowModel = layer.infowindow;
      self.legendModel     = layer.legend;

      self._bindTable(layer.table);
      self._bindSQLView(layer.sqlView);
      self.layerDataView = self.mapView.getLayerByCid(layer.cid);

      self.mapView.setActiveLayer(layer);
      self._addLegends();
      self._addTimeline();

      if (self.layerDataView) {
        self.layerDataView.bind('featureClick', self.featureClick, self);
        self.layerDataView.bind('featureOut',   self.featureOut,   self);
        self.layerDataView.bind('featureOver',  self.featureOver,  self);
        self.layerDataView.bind('loading',      self.loadingTiles, self);
        self.layerDataView.bind('load',         self.loadTiles,    self);
        self.layerDataView.bind('error',        self.loadTiles,    self);
      }

      // Set layer model binding
      if (layerView && layer) {
        layer.unbind('startEdition',this._addGeometry, this);
        layer.bind('startEdition', this._addGeometry, this);
      }

      if(layer) {
        self.layerModel = layer;
        layer.bind('change:interactivity', this._updateSQLHeader, this);
        this._updateSQLHeader();
      }

      if (self.options.geocoder) {
        self.options.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', this.updateDataLayerView, this);
      }

    }
  },

  _cleanLegends: function() {

    if (this.legends) {
      _.each(this.legends, function(legend) {
        legend.clean();
      });

    }

    this.legends = [];

  },

  _addLegends: function() {

    var self = this;

    this._cleanLegends();

    var models = this.map.layers.models;
    for(var i = models.length - 1; i >= 0; --i) {
      var layer = models[i];
      self._addLegend(layer);
    }



  },

  _addLegend: function(layer) {

    if (layer.get('type') === 'CartoDB') {

      if (this.table && this.mapView) {

        if (this.legend) this.legend.clean();

        if (layer.get("visible")) {
          var legend = new cdb.geo.ui.Legend({
            model: layer.legend,
            mapView: this.mapView,
            table: this.table
          });

          if (this.legends) {
            this.legends.push(legend);
            this._renderStackedLengeds();
          }
        }
      }
    }

  },

  _addTimeline: function() {
    if (!this.mapView) return;
    // check if there is some torque layer
    if(!this.map.layers.any(function(lyr) { return lyr.get('type') === 'torque' && lyr.get('visible'); })) {
      this.timeline && this.timeline.clean();
      this.timeline = null;
    } else {
      var layer = this.map.layers.getLayersByType('torque')[0];
      if (this.timeline) {
        // check if the model is different
        if (this.timeline.torqueLayer.model.cid !== layer.cid) {
          this.timeline.clean();
          this.timeline = null;
        } else {
          return;
        }
      }
      layerView = this.mapView.getLayerByCid(layer.cid);
      if (layerView) {
        this.timeline = new cdb.geo.ui.TimeSlider({
          layer: layerView
        });
        this.mapView.$el.append(this.timeline.render().$el);
        this.addView(this.timeline);
      }
    }
  },

  _renderStackedLengeds: function() {

    if (this.stackedLegend) this.stackedLegend.clean();
    if (this.legend)        this.legend.clean();

    this.stackedLegend = new cdb.geo.ui.StackedLegend({
      legends: this.legends
    });

    this.mapView.$el.append(this.stackedLegend.render().$el);
    this.addView(this.stackedLegend);

  },

  _renderLegend: function() {

    if (this.legend) this.legend.clean();

    this.legend = this.legends[0];

    this.mapView.$el.append(this.legend.render().$el);

    if (!this.legend.model.get("type")) this.legend.hide();
    else this.legend.show();

    this.addView(this.legend);

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
      if(this.geometryEditor) {
        this.geometryEditor.discard();
        this.geometryEditor.clean();
      }

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
      this.infowindow.bind('openInfowindowPanel', function() {
        this.activeLayerView.showModule('infowindow', 'fields');
      }, this);

      this.table.bind('remove:row', this.updateDataLayerView, this);

      this.table.bind('change:dataSource', function() {
        this.geometryEditor.discard();
      }, this);

      this.map.bind('change:provider', function() {
        this.geometryEditor.discard();
      }, this);
    }
  },

  _addGeometry: function(type) {
    this.geometryEditor.createGeom(this.table.data().newRow(), type);
  },

  _bindTable: function(table) {

    if (this.table) {
      this.table.unbind(null, null, this);
    }

    this.table = table;

    this.table.bind('change:dataSource', this._hideInfowindow, this);
    this.table.bind('change:dataSource', this._updateSQLHeader, this);

    this.table.bind('data:saved', function() {
      this.updateDataLayerView();
    }, this);

    this._addInfowindow();

    this._addLegends();

    this.bindGeoRefCheck();
  },

  _bindSQLView: function(sqlView) {
    if(this.sqlView) {
      this.sqlView.unbind(null, null, this);
    }
    this.sqlView = sqlView;
    this.sqlView.bind('reset error', this._updateSQLHeader, this);
    this.sqlView.bind('loading', this._renderLoading, this);
    this._updateSQLHeader();
  },

  _renderLoading: function(opts) {
    this._removeSQLViewHeader();

    //TODO: remove this hack
    if ($('.table_panel').length > 0) {
      panel_opened = $('.table_panel').css("right").replace("px","") == 0
    }

    var html = this.getTemplate('table/views/sql_view_notice_loading')({
      panel_opened: panel_opened
    });

    this.$('.cartodb-map').after(html);
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
    this.layerDataView.setInteraction && this.layerDataView.setInteraction(true);
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(1.0);
  },

  hideDataLayer: function() {
    this.layerDataView.setInteraction && this.layerDataView.setInteraction(false);
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(0.5);
  },

  /**
   * reload tiles
   */
  updateDataLayerView: function() {
    if(this.layerDataView) {
      this.layerDataView.invalidate();
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

    // if the dialog already has been shown, we don't show it again
    if(!this.noGeoRefDialog && !this.table.isInSQLView() && (!localStorage[warningStorageName])) {
      localStorage[warningStorageName] = true;

      this.noGeoRefDialog = new cdb.admin.NoGeoRefDataDialog({
        model: this.table,
        user: this.user,
        geocoder: this.options.geocoder
      });

      this.$el.append(this.noGeoRefDialog.render().el);
      this.noGeoRefDialog.open();
    }

  },

  //adds the green indicator when a query is applied
  _addSQLViewHeader: function() {
    this.$('.sqlview').remove();
    var total = this.table.data().size();
    var warnMsg = null;
    if (this.layerModel && !this.layerModel.get('interactivity')) {
      warnMsg = this._TEXTS.no_interaction_warn;
    }
    var html = this.getTemplate('table/views/sql_view_notice')({
      empty: !total,
      isVisualization: this.vis.isVisualization(),
      warnMsg: warnMsg
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
