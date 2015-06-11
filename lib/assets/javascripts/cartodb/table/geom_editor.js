
cdb.admin.GeometryEditor = cdb.core.View.extend({

  className: "editing",
  MAX_VERTEXES: 2000,

  events: {
    'click .done': 'finish',
    'click .discard': 'discard',
    'click .cancel': 'discard',
    'mousedown': 'killEvent'
  },

  TEXTS: {
    'invalid geometry': _t('Overlapping polygons is not supported for same record')
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
        this.row.set('the_geom', JSON.stringify(this.drawer.getGeoJSON()));
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
      }).fail(function(e) {
        self.trigger('editFinish');
        var err = 'Something has failed';
        try {
          err = JSON.parse(e.responseText || e.response).errors[0];
        } catch(e) {}
        err = self.TEXTS[err.toLowerCase()] || err;
        self.model.notice(err , 'error', 5000);
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
    this.mapView.unbind(null, null, this);
    this.hide();
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

  /**
   * edits the row geometry
   * the row should contain the_geom attribute.
   * When the edit is finish the row is saved
   */
  editGeom: function(row) {
    var self = this;

    //fetch to get the geometry 
    row.fetch({
      success: function() {
        var geojson = JSON.parse(row.get('the_geom'));
        if (self._getGeomCount(geojson) > self.MAX_VERTEXES) {
          self._showStopEdit(row);
          return false;
        } else {
          self._startEdition(row);
        }
      }
    });

  },

  _startEdition: function(row) {
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

    this.row = row;
    this.originalGeom = row.get('the_geom');
    this.geomBeingEdited = geo;

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

  _showStopEdit: function(row) {

    var self = this;
    var edit_confirmation = new cdb.admin.BaseDialog({
      title: "This geometry is too big to edit from the web",
      description: "Editing this geometry could freeze or crash your browser, and you could lose your work. We encourage you to edit this feature through the API.",
      template_name: 'old_common/views/confirm_dialog',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "right button grey",
      ok_title: "I'll take the risk",
      cancel_button_classes: "underline margin15",
      cancel_title: "Cancel",
      modal_type: "confirmation",
      width: 500
    });

    // If user confirms, app removes the row
    edit_confirmation.ok = function() {
      self._startEdition(row);
    }

    edit_confirmation
      .appendToBody()
      .open();
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

