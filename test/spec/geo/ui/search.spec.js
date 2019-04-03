var $ = require('jquery');
var Backbone = require('backbone');
var Search = require('../../../../src/geo/ui/search/search');

var mapboxGeocoder = require('../../../../src/geo/geocoder/mapbox-geocoder');
var tomtomGeocoder = require('../../../../src/geo/geocoder/tomtom-geocoder');

var Map = require('../../../../src/geo/map');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var fakeEvent = {
  preventDefault: jasmine.createSpy()
};

describe('geo/ui/search', function () {
  beforeEach(function () {
    this.$el = $('<div>')
      .attr('id', 'map')
      .height(500)
      .width(500);
    $('body').append(this.$el);
    this.map = new Map(null, { layersFactory: {} });
    this.mapView = new LeafletMapView({
      el: this.$el,
      mapModel: this.map,
      engine: new Backbone.Model(),
      layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
      layerGroupModel: new Backbone.Model()
    });
    this.mapView.render();

    this.view = new Search({
      model: this.map,
      mapView: this.mapView,
      token: 'a_valid_api_key'
    });
    this.view.render();
  });

  it('should use tomtom geocoder by default', function () {
    expect(this.view.geocoder).toBe(tomtomGeocoder);
  });

  it('should allow changing geocoder easily', function () {
    var search = new Search({
      model: this.map,
      mapView: this.mapView,
      geocoderService: 'mapbox', // <<<
      token: 'a_valid_mapbox_api_key'
    });
    expect(search.geocoder).toBe(mapboxGeocoder);
  });

  it('should render properly', function () {
    expect(this.view.$('.js-form').length).toBe(1);
    expect(this.view.$('.js-textInput').length).toBe(1);
    expect(this.view.$('input[type="submit"]').length).toBe(0);
    expect(this.view.$('span.loader').length).toBe(0);
  });

  describe('onSubmit', function () {
    beforeEach(function () {
      this.result = {
        lat: 43.0,
        lon: -3.0,
        boundingbox: {
          south: 6.0,
          north: 4.0,
          west: 6.0,
          east: 4.0
        },
        type: undefined
      };
      // spyOn(this.view.geocoder, 'geocode').and.callThrough();
      spyOn(this.view.geocoder, 'geocode').and.returnValue(Promise.resolve([{
        center: [40.41889, -3.69194],
        type: 'localadmin'
      }]));
      this.view.$('.js-textInput').val('Madrid, Spain');
    });

    it('should search with geocoder when form is submit', function () {
      this.view.$('.js-form').submit();
      expect(this.view.geocoder.geocode).toHaveBeenCalled();
    });

    it('should change map center when geocoder returns any result', function (done) {
      var onCenterChangedSpy = jasmine.createSpy('onCenterChangedSpy');
      this.map.bind('change:center', onCenterChangedSpy, this.view);
      this.view._onSubmit(fakeEvent).then(function () {
        expect(onCenterChangedSpy).toHaveBeenCalled();
        this.map.unbind('change:center', onCenterChangedSpy, this.view);
        done();
      }.bind(this));
    });

    describe('result zoom', function () {
      function testZoom (context, featureType, expectedZoom, done) {
        context.view.geocoder.geocode.and.returnValue(Promise.resolve([{
          center: [43.0, -3],
          type: featureType
        }]));

        context.view._onSubmit(fakeEvent).then(function () {
          expect(context.map.get('zoom')).toBe(expectedZoom);
          done();
        });
      }

      it('should zoom to 18 when search result is building type', function (done) {
        testZoom(this, 'building', 18, done);
      });

      it('should zoom to 15 when search result is postal-area type', function (done) {
        testZoom(this, 'postal-area', 15, done);
      });

      it('should zoom to 18 when search result is venue type', function (done) {
        testZoom(this, 'venue', 18, done);
      });

      it('should zoom to 8 when search result is region type', function (done) {
        testZoom(this, 'region', 8, done);
      });

      it('should zoom to 5 when search result is country type', function (done) {
        testZoom(this, 'country', 5, done);
      });

      it('should zoom to 8 when search result is county type', function (done) {
        testZoom(this, 'county', 8, done);
      });

      it('should zoom to 18 when search result is address type', function (done) {
        testZoom(this, 'address', 18, done);
      });

      it('should zoom to 12 when search result is locality type', function (done) {
        testZoom(this, 'locality', 12, done);
      });

      it('should zoom to 11 when search result is localadmin type', function (done) {
        testZoom(this, 'localadmin', 11, done);
      });

      it('should zoom to 15 when search result is neighbourhood type', function (done) {
        testZoom(this, 'neighbourhood', 15, done);
      });

      it('should zoom to 12 when search result is unknown type', function (done) {
        testZoom(this, 'whatever', 12, done);
      });
    });

    describe('searchPin', function () {
      beforeEach(function () {
        this.view.options.searchPin = true;
      });

      it('should add a pin and an infowindow when search is completed', function (done) {
        this.view._onSubmit(fakeEvent).then(function () {
          expect(this.view._searchPin).toBeDefined();
          expect(this.view._searchInfowindow).toBeDefined();
          done();
        }.bind(this));
      });

      it('should place pin in the feature center', function (done) {
        this.view._onSubmit(fakeEvent).then(function () {
          expect(this.view._searchPin.get('latlng')).toEqual([40.41889, -3.69194]);
          done();
        }.bind(this));
      });

      it('should display address in the search infowindow', function (done) {
        this.view._onSubmit(fakeEvent).then(function () {
          expect(this.view._searchInfowindow.$('.CDB-infowindow-title').text()).toBe('Madrid, Spain');
          done();
        }.bind(this));
      });

      it('should destroy/hide search pin when map is clicked', function (done) {
        var view = this.view;
        view._onSubmit(fakeEvent).then(function () {
          expect(view._searchPin).toBeDefined();
          expect(view._searchInfowindow).toBeDefined();
          this.mapView.trigger('click');
          setTimeout(function () {
            expect(view._searchPin).toBeUndefined();
            expect(view._searchInfowindow).toBeUndefined();
            done();
          }, 1000);
        }.bind(this));
      });
    });
  });

  afterEach(function () {
    this.$el.remove();
  });
});
