var RangeFilter = require('../../../../../src/windshaft/filters/range');
var HistogramDataviewDataProvider = require('../../../../../src/geo/data-providers/geojson/histogram-dataview-data-provider');

describe('src/geo/data-providers/geojson/histogram-dataview-data-provider.js', function () {
  beforeEach(function () {
    this.vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on', 'applyFilter']);
    var dataview = jasmine.createSpyObj('dataview', ['get']);
    dataview.get.and.callFake(function (attr) {
      if (attr === 'column') {
        return 'columnName';
      }
    });
    this.dataProvider = new HistogramDataviewDataProvider({
      dataview: dataview,
      vectorLayerView: this.vectorLayerView,
      layerIndex: 0
    });
  });

  describe('.getData', function () {
    it('should return the data', function () {
      // TODO: Test this
    });
  });

  describe('.applyFilter', function () {
    it('should apply an infite range when the filter is empty', function () {
      var filter = new RangeFilter();

      this.dataProvider.applyFilter(filter);
      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'range', { column: 'columnName', min: 0, max: Infinity });
    });

    it('should filter by range', function () {
      var filter = new RangeFilter();
      filter.setRange(10, 1000);

      this.dataProvider.applyFilter(filter);
      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'range', { column: 'columnName', min: 10, max: 1000 });
    });
  });
});
