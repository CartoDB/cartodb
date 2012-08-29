

/**
 * load a visualization in vizjson format:
 *
 * file format:
 *
 * {
 *  // required
 *  // follows the http://semver.org/ style version number
 *  "version": "0.1.0"
 *
 *  // optional
 *  // default: [0, 0]
 *  // [lat, lon] where map is placed when is loaded. If bounds is present it is ignored
 *  "center": [0, 0],
 *
 *  "zoom": 4,
 *
 *  // optional
 *  // default: []
 *  // contains the layers
 *  "layers": [],
 *
 *  overlays: [{
 *    type: 'zoom',
 *    template: 'mustache template'
 *  }],
 *
 *
 * }
 */


var Vis = cdb.core.View.extend({

  initialize: function() {
  },

  load: function(data) {

    // map
    var map = new cdb.geo.Map();
    var div = $('<div>').css({
      width: '100%',
      height: '100%'
    });
    this.$el.append(div);
    var mapView = new cdb.geo.LeafletMapView({
      el: div,
      map: map
    });
    this.map = map;
    this.mapView = mapView;
    

    // overlays
    for(var i in data.overlays) {
      var overlay = data.overlays[i];
      this._createOverlay(overlay);
    }

    map.setCenter(data.center || [0, 0]);
    map.setZoom(data.zoom || 4);
  },
  
  _createZoom: function(data) {
    var zoom = new cdb.geo.ui.Zoom({
      model: this.map,
      el: $('<div>'),
      template: cdb.core.Template.compile(data.template)
    });
    this.mapView.$el.append(zoom.render().el);
    zoom.$el.css({
      position: 'absolute',
      top: data.pos[0],
      left: data.pos[1]
    });
    this.addView(zoom);
  },

  _createOverlay: function(overlay) {
    this[Vis.overlayTypes[overlay.type]](overlay);
  }

}, {
  overlayTypes: {
    'zoom': '_createZoom'
  }
  
});

cdb.Vis = Vis;
