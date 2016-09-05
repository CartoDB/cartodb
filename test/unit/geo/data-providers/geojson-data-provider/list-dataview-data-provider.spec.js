var ListDataviewDataProvider = require('../../../../../src/geo/data-providers/geojson/list-dataview-data-provider');

describe('src/geo/data-providers/geojson/list-dataview-data-provider.js', function () {
  beforeEach(function () {
    this.vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on', 'applyFilter']);
    var dataview = jasmine.createSpyObj('dataview', ['get']);
    dataview.get.and.callFake(function (attr) {
      if (attr === 'column') {
        return 'columnName';
      }
    });
    this.dataProvider = new ListDataviewDataProvider({
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
});
