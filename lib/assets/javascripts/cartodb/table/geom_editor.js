
cdb.admin.GeometryEditor = cdb.core.View.extend({

  className: "editing",
  MAX_VERTEXES: 2000,

  events: {
    'click .done': 'finish',
    'click .discard': 'discard',
    'mousedown': 'killEvent'
  },

  initialize: function() {
    this.add_related_model(this.model);
    this.geomBeingEdited = null;
  },

  /**
   * finish the editing if there is some geometry being edited and save it
   * triggers editFinish
   */
  finish: function() {
    var self = this;
    if(this.geomBeingEdited) {
      this.geomBeingEdited.destroy();
      this.geomBeingEdited = null;
      this.model.notice('Saving ... ', 'load');

      $.when(this.row.save(null)).done(function() {
        self.trigger('editFinish');
        self.model.notice('Saved', 'info', 3000);
      }).fail(function() {
        self.model.notice('Something has failed', 'error', 5000);
      });
      this.row = null;
    }
    this.hide();
  },

  /**
   * finish the editing and undo the changes done.
   * triggers 'editDiscard'
   */
  discard: function() {
    if(this.geomBeingEdited) {
      this.geomBeingEdited.destroy();
      this.geomBeingEdited = null;
      this.row.set('the_geom', this.originalGeom);
      this.originalGeom = null;
      this.row = null;
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
      style: {fillColor: "white", fillOpacity: 0.4, weight: 4, color:"#397DBA", opacity: 1}
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
    this.$('.finish_editing').show();
    this.$('.new_geometry').hide();
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

  //TODO: done geometry creating
  /**
   * create geometry
   * @param row a row model, normally empty
   * @param type can be 'point' or 'polygon'
   */
  /*
  createGeom: function(row, type) {
    this.discard();
    this.row = row;
    this.geomType = type;
    this.mapView.bind('click', this._mapClick, this);
    this.$('.finish_editing').hide();
    this.$('.new_geometry').show();
    this.$el.fadeIn();
  },

  _mapClick: function(e, latlng) {
    this.mapView.unbind('click', this._mapClick, this);
    // 30 dregrees at top zoom
    var inc = 30/(1<<this.mapView.map.getZoom());
    //create a simple geom and edit it
    var geoms = {
      'point': {
        type: 'Point',
        coordinates: [latlng[1], latlng[0]]
      },
      'polygon': {
        type: 'MultiPolygon',
        coordinates: [[[
          [latlng[1], latlng[0]],
          [latlng[1] + 2*inc, latlng[0]],
          [latlng[1] + 2*inc, latlng[0] + inc],
          [latlng[1], latlng[0] + inc]
          //[latlng[1], latlng[0]]
        ]]]
      }
    };
    var geo = geoms[this.geomType];
    this.row.set('the_geom', JSON.stringify(geo));
    this.editGeom(this.row);
    e && e.preventDefault();
    return false;
  },
  */

  render: function() {
    this.$el.html(this.getTemplate('table/views/geom_edit')());
    return this;
  }
});

