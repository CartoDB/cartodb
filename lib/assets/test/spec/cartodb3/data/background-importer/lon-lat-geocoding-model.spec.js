var cdb = require('cartodb.js');
var LonLatGeocodingModel = require('../../../../../javascripts/cartodb3/data/background-importer/lon-lat-geocoding-model.js');
var TableModel = require('../../../../../javascripts/cartodb3/data/table-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');

describe('background-importer/lon-lat-geocoding-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.table = new TableModel({
      id: 'abc-123',
      name: 'test'
    }, {
      configModel: configModel
    });
    spyOn(this.table, 'save');
    this.model = new LonLatGeocodingModel({
      table: this.table,
      longitude_column: 'lon',
      latitude_column: 'lat',
      force_all_rows: false
    });
  });

  it('should set table name', function () {
    expect(this.model.get('table_name')).toEqual('test');
  });

  it('should start geocoding immediately', function () {
    expect(this.table.save).toHaveBeenCalled();
  });

  it('should save table with expected data', function () {
    var args = this.table.save.calls.argsFor(0);
    expect(args[0].longitude_column).toEqual('lon');
    expect(args[0].latitude_column).toEqual('lat');
    expect(args[0].force_all_rows).toEqual(false);
  });

  it('should have ongoing state', function () {
    expect(this.model.hasCompleted()).toBeFalsy();
    expect(this.model.hasFailed()).toBeFalsy();
    expect(this.model.isOngoing()).toBeTruthy();
  });

  xdescribe('when geocoding finished successfully', function () {
    beforeEach(function () {
      this.tableDataSpy = jasmine.createSpyObj('table.data()', ['fetch']);
      spyOn(this.table, 'data').and.returnValue(this.tableDataSpy);
      this.geolocatedSpy = jasmine.createSpy('geolocated');
      this.table.bind('geolocated', this.geolocatedSpy);
      this.table.save.calls.argsFor(0)[1].success();
    });

    it('should trigger a geolocated event on table', function () {
      expect(this.geolocatedSpy).toHaveBeenCalled();
    });

    it('should fetch table data', function () {
      expect(this.tableDataSpy.fetch).toHaveBeenCalled();
    });

    it('should change state to completed', function () {
      expect(this.model.hasCompleted()).toBeTruthy();
      expect(this.model.hasFailed()).toBeFalsy();
      expect(this.model.isOngoing()).toBeFalsy();
    });
  });

  describe('when geocoding fails', function () {
    beforeEach(function () {
      this.table.save.calls.argsFor(0)[1].error('lol', {
        responseText: '{ "errors": ["some explanation"] }'
      });
    });

    it('should set error', function () {
      expect(this.model.get('error')).toEqual('some explanation');
    });

    it('should change state to completed', function () {
      expect(this.model.hasCompleted()).toBeFalsy();
      expect(this.model.hasFailed()).toBeTruthy();
      expect(this.model.isOngoing()).toBeFalsy();
    });
  });
});
