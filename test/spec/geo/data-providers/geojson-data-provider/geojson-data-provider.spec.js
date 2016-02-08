var _ = require('underscore');
var GeoJSONDataProvider = require('../../../../../src/geo/data-providers/geojson/geojson-data-provider');
var CategoryFilter = require('../../../../../src/windshaft/filters/category');
var RangeFilter = require('../../../../../src/windshaft/filters/range');

describe('src/geo/data-providers/geojson/geojson-data-provider.js', function () {
  it('should trigger a FeaturesChanged event when the features on the layerView have changed', function () {
    var vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on']);

    var callbackForLayer0 = jasmine.createSpy('callback');
    var providerForLayer0 = new GeoJSONDataProvider(vectorLayerView, 0);
    providerForLayer0.bind('featuresChanged', callbackForLayer0);

    var callbackForLayer1 = jasmine.createSpy('callback');
    var providerForLayer1 = new GeoJSONDataProvider(vectorLayerView, 1);
    providerForLayer1.bind('featuresChanged', callbackForLayer1);

    // Event is fired
    var featuresChangedCallbacks = _.map(vectorLayerView._on.calls.all(), function (call) {
      return call.args[1];
    });
    _.each(featuresChangedCallbacks, function (callback) {
      callback([
        [
          { a: 'b' }
        ],
        [
          { b: 'c' }
        ]
      ]);
    });

    expect(callbackForLayer0).toHaveBeenCalledWith([
      { a: 'b' }
    ]);

    expect(callbackForLayer1).toHaveBeenCalledWith([
      { b: 'c' }
    ]);
  });

  describe('applyFilter', function () {
    beforeEach(function () {
      this.vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on', 'applyFilter']);
      this.geoJSONProvider = new GeoJSONDataProvider(this.vectorLayerView, 0);
    });

    describe('when the filter is unknown', function () {
      it('should raise an error', function () {
        var filter = {};

        expect(function () {
          this.geoJSONProvider.applyFilter('city', filter);
        }.bind(this)).toThrowError("Filter on city couldn't be applied. Filter type wasn't recognized.");
      });
    });

    describe('when the filter is a category filter', function () {
      it('should accept all values when the filter is empty', function () {
        var filter = new CategoryFilter();
        this.geoJSONProvider.applyFilter('city', filter);

        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'accept', { column: 'city', values: 'all' });
      });

      it('should accept some values', function () {
        var filter = new CategoryFilter();
        filter.accept('Madrid');
        filter.accept('Barcelona');

        this.geoJSONProvider.applyFilter('city', filter);
        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'accept', { column: 'city', values: [ 'Madrid', 'Barcelona' ] });
      });

      it('should reject some values', function () {
        var filter = new CategoryFilter();
        filter.reject('Madrid');
        filter.reject('Barcelona');

        this.geoJSONProvider.applyFilter('city', filter);
        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'reject', { column: 'city', values: [ 'Madrid', 'Barcelona' ] });
      });

      it('should reject all values', function () {
        var filter = new CategoryFilter();
        filter.accept('Madrid');
        filter.accept('Barcelona');
        filter.rejectAll();

        this.geoJSONProvider.applyFilter('city', filter);
        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'reject', { column: 'city', values: 'all' });
      });
    });

    describe('when the filter is a range filter', function () {
      it('should apply an infite range when the filter is empty', function () {
        var filter = new RangeFilter();

        this.geoJSONProvider.applyFilter('age', filter);
        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'range', { column: 'age', min: 0, max: Infinity });
      });

      it('should filter by range', function () {
        var filter = new RangeFilter();
        filter.setRange(10, 1000);

        this.geoJSONProvider.applyFilter('age', filter);
        expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'range', { column: 'age', min: 10, max: 1000 });
      });
    });
  });
});
