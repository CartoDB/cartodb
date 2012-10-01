
cdb.admin.GeometryEditor = cdb.core.View.extend({

  initialize: function() {
    this.add_related_model(this.model);
    this.geomBeingEdited = null;
  },

  /**
   * finish the editing if there is some geometry being edited
   */
  finishEditing: function() {
    if(this.geomBeingEdited) {
      this.geomBeingEdited.destroy();
      this.geomBeingEdited = null;
      this.trigger('editFinish');
    }
  },

  _editGeom: function(row) {

    var self = this;
    this.trigger('editStart');
    this.finishEditing();
    var geo = new cdb.geo.Geometry({
      geojson: JSON.parse(row.get('the_geom'))
    });

    self.geomBeingEdited = geo;

    // when model is edited the model changes
    geo.bind('change:geojson', function() {
      row.save({the_geom: JSON.stringify(geo.get('geojson'))});
      self.finishEditing();
    });

    this.mapView.map.addGeometry(geo);
    var geoView = this.mapView.geometries[geo.cid];
    geoView.edit(true);
  }
});

