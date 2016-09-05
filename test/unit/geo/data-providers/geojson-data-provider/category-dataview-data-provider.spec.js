var CategoryFilter = require('../../../../../src/windshaft/filters/category');
var CategoryDataviewDataProvider = require('../../../../../src/geo/data-providers/geojson/category-dataview-data-provider');

describe('src/geo/data-providers/geojson/category-dataview-data-provider.js', function () {
  beforeEach(function () {
    this.vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on', 'applyFilter']);
    var dataview = jasmine.createSpyObj('dataview', ['get']);
    dataview.get.and.callFake(function (attr) {
      if (attr === 'column') {
        return 'columnName';
      }
    });
    this.dataProvider = new CategoryDataviewDataProvider({
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
    it('should accept all values when the filter is empty', function () {
      var filter = new CategoryFilter();
      this.dataProvider.applyFilter(filter);

      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'accept', { column: 'columnName', values: 'all' });
    });

    it('should accept some values', function () {
      var filter = new CategoryFilter();
      filter.accept('Madrid');
      filter.accept('Barcelona');

      this.dataProvider.applyFilter(filter);
      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'accept', { column: 'columnName', values: [ 'Madrid', 'Barcelona' ] });
    });

    it('should reject some values', function () {
      var filter = new CategoryFilter();
      filter.reject('Madrid');
      filter.reject('Barcelona');

      this.dataProvider.applyFilter(filter);
      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'reject', { column: 'columnName', values: [ 'Madrid', 'Barcelona' ] });
    });

    it('should reject all values', function () {
      var filter = new CategoryFilter();
      filter.accept('Madrid');
      filter.accept('Barcelona');
      filter.rejectAll();

      this.dataProvider.applyFilter(filter);
      expect(this.vectorLayerView.applyFilter).toHaveBeenCalledWith(0, 'reject', { column: 'columnName', values: 'all' });
    });
  });
});
