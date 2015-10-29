var $ = require('jquery');
var Backbone = require('backbone');
var config = require('cdb.config');
var Map = require('../../../../src-browserify/geo/map');
var MapView = require('../../../../src-browserify/geo/map-view');
var Infowindow = require('../../../../src-browserify/geo/ui/infowindow');

describe('core/geo/map-view', function() {
  beforeEach(function() {
    this.container = $('<div>').css('height', '200px');

    this.map = new Map();
    this.mapView = new MapView({
      el: this.container,
      map: this.map
    });
  });

  it('should be able to add a infowindow', function() {
    var infow = new Infowindow({mapView: this.mapView, model: new Backbone.Model()});
    this.mapView.addInfowindow(infow);

    expect(this.mapView._subviews[infow.cid]).toBeTruthy()
    expect(this.mapView._subviews[infow.cid] instanceof Infowindow).toBeTruthy()
  });

  it('should be able to retrieve the infowindows', function() {
    var infow = new Infowindow({mapView: this.mapView, model: new Backbone.Model()});
    this.mapView._subviews['irrelevant'] = new Backbone.View();
    this.mapView.addInfowindow(infow);

    var infowindows = this.mapView.getInfoWindows()

    expect(infowindows.length).toEqual(1);
    expect(infowindows[0]).toEqual(infow);
  });
});
