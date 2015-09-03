/**
 *  Search overlay for editor.
 *  Adding custom infowindow providing:
 *
 *  - Add a new point in that position.
 *  - Add a new annotation.
 *
 */

cdb.admin.SearchControl = cdb.geo.ui.Search.extend({

  _createInfowindow: function(position, address) {
    var infowindowModel = new cdb.geo.ui.InfowindowModel({
      template: this.options.infowindowTemplate,
      latlng: position,
      width: this.options.infowindowWidth,
      offset: this.options.infowindowOffset,
      content: {
        fields: [{
          title: 'address',
          value: address
        }]
      }
    });

    this._searchInfowindow = new cdb.admin.SearchInfowindow({
      model: infowindowModel,
      mapView: this.mapView,
      vis: this.options.vis,
      canvas: this.options.canvas
    });

    this.mapView.$el.append(this._searchInfowindow.el);
    infowindowModel.set('visibility', true);
  }

});
