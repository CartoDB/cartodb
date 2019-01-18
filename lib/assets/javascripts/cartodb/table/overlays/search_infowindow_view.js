/**
 *  Custom infowindow only for search control
 *  - It provides two options, add a point or
 *  add an annotation.
 *
 */

cdb.admin.SearchInfowindow = cdb.geo.ui.Infowindow.extend({

  events: cdb.geo.ui.Infowindow.extendEvents({
    'click .js-addPoint': '_addPoint',
    'click .js-addAnnotation': '_addAnnotation'
  }),

  initialize: function() {
    this.layerModel = this.options.mapView.activeLayerModel;
    this.layerData = this.options.mapView.getLayerByCid(this.layerModel.cid);
    this.table = this.layerModel.table;
    cdb.geo.ui.Infowindow.prototype.initialize.call(this, arguments);
  },

  render: function() {
    this.clearSubViews();
    this.elder('render');
    this._setEditButtons();
    return this;
  },

  _setEditButtons: function() {
    var isVisualization = this.options.vis.isVisualization();
    var canAddPoint = this._canAddPoint();
    this.$('.add_annotation').toggleClass('disabled', !isVisualization);
    this.$('.add_point').toggleClass('disabled', !canAddPoint);

    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.add_annotation'),
        title: function(e) {
          return !isVisualization ? $(this).attr('data-title') : $(this).text()
        }
      })
    );

    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.add_point'),
        title: function(e) {
          return !canAddPoint ? $(this).attr('data-title') : $(this).text()
        }
      })
    );
  },

  _addPoint: function(ev) {
    if (ev) {
      ev.preventDefault();
    }
    var self = this;

    this.model.set('visibility', false);

    if (this.table) {
      var geomTypes = this.table.geomColumnTypes();
      // Only allow add points if the data layer is made of that.
      if (!_.contains(geomTypes,'point') && !_.isEmpty(geomTypes)) {
        return false;
      }
      var row = this.table.data().newRow();
      row.save({
        the_geom: '{ "type": "Point", "coordinates": [' + this.model.get('latlng')[1] + ',' + this.model.get('latlng')[0] + '] }'
      }, {
        success: function() {
          self.layerData.invalidate();
        },
        error: function(e, resp) {
          self.table.error("Error adding a new row", resp);
        }
      });
    }
  },

  _addAnnotation: function(ev) {
    if (ev) {
      ev.preventDefault();
    }

    if (!this.options.vis.isVisualization()) {
      return;
    }

    this.model.set('visibility', false);
    
    var address = this._getAddress();

    // TODO: remove these styles when annotation model
    // has these default values defined.
    var defaultStyle = {
      "z-index": 4,
      color: "#ffffff",
      "text-align": "left",
      "font-size": "13",
      "font-family-name": "Helvetica",
      "box-color": "#000000",
      "box-opacity": .7,
      "box-padding": 5,
      "line-color": "#000000",
      "line-width": 50,
      "min-zoom": this.mapView.map.get("minZoom"),
      "max-zoom": this.mapView.map.get("maxZoom")
    };

    var defaultOptions = {
      latlng: this.model.get("latlng"),
      text: address
    };

    var model = new cdb.admin.models.Overlay({
      type: "annotation",
      display: true,
      device: this.options.canvas.get("mode"),
      extra: defaultOptions,
      style: defaultStyle
    });

    this.options.vis.overlays.add(model);
    model.save();
  },

  _canAddPoint: function() {
    var geomTypes = this.table.geomColumnTypes();
    // Only allow add points if the data layer is made of that.
    if (!_.contains(geomTypes,'point') && !_.isEmpty(geomTypes)) {
      return false;
    }

    if (this.table.isReadOnly()) {
      return false;
    }

    return true;
  },

  _getAddress: function() {
    return this.model.get('content').fields[0].value;
  }

})
