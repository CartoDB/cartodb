var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');

describe('data/table-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      configModel: configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/tables/foobar_table');
  });

  it('should provide means for a custom URL for columns collection', function () {
    expect(this.model.columnsCollection.url()).toEqual('/u/pepe/api/v1/tables/foobar_table/columns');
  });

  describe('getGeometryType', function () {
    it('should return the geometries those are present in the table', function () {
      this.model.set('geometry_types', ['ST_MULTIPOINT']);
      expect(this.model.getGeometryType()).toEqual(['point']);
      this.model.set('geometry_types', ['ST_POINT']);
      expect(this.model.getGeometryType()).toEqual(['point']);
      this.model.set('geometry_types', ['ST_MULTIPOLYGON']);
      expect(this.model.getGeometryType()).toEqual(['polygon']);
      this.model.set('geometry_types', ['ST_POLYGON']);
      expect(this.model.getGeometryType()).toEqual(['polygon']);
      this.model.set('geometry_types', ['ST_LINESTRING']);
      expect(this.model.getGeometryType()).toEqual(['line']);
      this.model.set('geometry_types', ['ST_MULTILINESTRING']);
      expect(this.model.getGeometryType()).toEqual(['line']);
    });

    it('shouldn\'t return the same geometry several times', function () {
      this.model.set('geometry_types', ['ST_MULTIPOINT', 'ST_POINT', 'ST_POLYGON']);
      expect(this.model.getGeometryType()).toEqual(['point', 'polygon']);
    });
  });
});
