
cdb.admin.GeometryEditor = cdb.core.View.extend({

  className: "editing",
  MAX_VERTEXES: 2000,

  events: {
    'click .done': 'finish',
    'click .discard': 'discard',
    'click .cancel': 'discard',
    'mousedown': 'killEvent'
  },

  initialize: function() {
    this.add_related_model(this.model);
    this.geomBeingEdited = null;
    this.drawer = null;
  },

  isEditing: function() {
    return this.geomBeingEdited ? true: false;
  },

  /**
   * finish the editing if there is some geometry being edited and save it
   * triggers editFinish
   */
  finish: function(e) {
    this.killEvent(e);

    if ((this.drawer && this.drawer.canFinish()) || this.isEditing()) {
      var self = this;

      if(this.geomBeingEdited) {
        this.geomBeingEdited.destroy();
        this.geomBeingEdited = null;
      }
      if(this.drawer) {
        this.row.set('the_geom', this.drawer.getGeoJSON());
        this.drawer.clean();
        this.drawer = null;
      }
      var isNew = this.row.isNew()

      this.model.notice('Saving ... ', 'load');
      $.when(this.row.save(null)).done(function() {
        if(isNew){
          self.trigger('geomCreated', self.row);
        }
        self.trigger('editFinish')
        self.model.notice('Saved', 'info', 5000);
        self.row = null;
      }).fail(function() {
        self.trigger('editFinish');
        self.model.notice('Something has failed', 'error', 5000);
        self.row = null;
      });


      this.hide(); 
    }
  },

  /**
   * finish the editing and undo the changes done.
   * triggers 'editDiscard'
   */
  discard: function(e) {
    this.killEvent(e);
    if(this.geomBeingEdited) {
      this.geomBeingEdited.destroy();
      this.geomBeingEdited = null;
      this.row.set('the_geom', this.originalGeom);
      this.originalGeom = null;
      this.row = null;
      this.trigger('editDiscard');
    }
    if(this.drawer) {
      this.drawer.clean();
      this.drawer = null;
      this.trigger('editDiscard');
    }
    this.hide();
  },

  /**
   * edits the row geometry
   * the row should contain the_geom attribute.
   * When the edit is finish the row is saved
   */
  editGeom: function(row) {
    var self    = this
      , geojson = JSON.parse(row.get('the_geom'));

    if (this._getGeomCount(geojson) > this.MAX_VERTEXES) {
      this.trigger('editStop');
      this._showStopEdit();
      return false;
    }

    this.trigger('editStart');
    this.discard();
    var geo = new cdb.geo.Geometry({
      geojson: JSON.parse(row.get('the_geom')),
      // Supporting leaflet and gmaps styles, overrriding them
      style: {
        fillColor: "white",
        fillOpacity: 0.4, 
        weight: 4, 
        color:"#397DBA", 
        opacity: 1,
        strokeColor: "#397DBA",
        clickable: false
      }
    });

    self.row = row;
    self.originalGeom = row.get('the_geom');
    self.geomBeingEdited = geo;

    // when model is edited the model changes
    geo.bind('change:geojson', function() {
      row.set({the_geom: JSON.stringify(geo.get('geojson'))});
    });

    this.mapView.map.addGeometry(geo);
    var geoView = this.mapView.geometries[geo.cid];
    geoView.edit(true);
    this.$('.finish_editing .tooltip').hide();
    this.$el.fadeIn();
  },

  _getGeomCount: function(geojson) {
    var count = 0;

    _.each(geojson.coordinates, function(pol1, i){
      _.each(pol1, function(pol2, j) {
        count = count + pol2.length;
      })
    });

    return count;
  },

  _showStopEdit: function(ev) {
    var stopEdit = new cdb.admin.StopEditDialog();

    this.$el.closest("body").append(stopEdit.render().el);
    stopEdit.open();
  },

  /**
   * create geometry
   * @param row a row model, normally empty
   * @param type can be 'point', 'polygon', 'line'
   */
  createGeom: function(row, type) {
    var self = this;
    this.discard();
    this.row = row;
    this.geomType = type;
    this.trigger('editStart');
    var editors = {
      'point': PointDrawTool,
      'polygon': PolygonDrawTool,
      'line': PolylineDrawTool
    };
    this.drawer = new editors[type]({
      mapview: this.mapView
    });
    this.drawer.start();
    var c;
    this.mapView.bind('click', c = function() {
      if(self.drawer.canFinish()) {
        this.mapView.unbind('click', c);
        self.$('.finish_editing .tooltip').fadeOut();
        self.$('.finish_editing .done').removeClass("disabled");
      }
    }, this);
    this.render();
    this.$('.finish_editing .done').addClass("disabled");
    this.$('.finish_editing .tooltip').show();
    this.$el.fadeIn();
  },

  render: function() {
    this.$el.html(this.getTemplate('table/views/geom_edit')({ geom_type: this.geomType}));
    return this;
  }
});

