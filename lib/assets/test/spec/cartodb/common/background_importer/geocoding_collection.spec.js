var GeocodingsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/geocodings_collection');
var GeocodingModel = require('../../../../../javascripts/cartodb/common/background_polling/models/geocoding_model');

describe('common/background_polling/geocodings_collection', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com'
    });
    GeocodingsCollection.prototype.sync = function(a,b,opts) {
      opts.success();
    };
    this.collection = new GeocodingsCollection(undefined, {
      user: this.user
    });
  });

  describe('polling', function(){

    beforeEach(function(){
      this.vis = new cdb.admin.Visualization({
        type: 'derived',
        name: 'my name'
      });

      var cartoLayer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

      this.vis.map.layers.reset([
        new cdb.geo.MapLayer(),
        cartoLayer
      ]);
    });

    it('should start polling the model because visualization is not defined', function() {
      spyOn(this.collection, 'add');
      this.collection.parse({ geocodings: [ { id: 1 } ]});
      expect(this.collection.add).toHaveBeenCalled();
    });

    it('should start polling the geocoding model because visualization is defined and layer added to it', function() {
      this.collection.vis = this.vis;
      spyOn(this.collection, 'add');
      this.collection.parse({ geocodings: [ { id: 1, table_name: 'test_table' } ]});
      expect(this.collection.add).toHaveBeenCalled();
    });

    it('should not start polling the geocoding model because visualization is defined but layer is not on it', function() {
      this.collection.vis = this.vis;
      spyOn(this.collection, 'add');
      this.collection.parse({ geocodings: [ { id: 1, table_name: 'hello' } ]});
      expect(this.collection.add).not.toHaveBeenCalled();
    });

    it('should stop polling if there is an error in the poll checker request', function() {
      this.collection.sync = function(a,b,opts) {
        opts.error()
      };
      this.collection.pollCheck();
      expect(this.collection.pollTimer).not.toBeDefined();
    });
  });

  it('should determine if a new geocoding could be possible', function() {
    expect(this.collection.canGeocode()).toBeTruthy();
    this.collection.reset([ {}, { state: 'failed' }, {} ]);
    expect(this.collection.canGeocode()).toBeFalsy();
    this.collection.reset([ { state: 'failed' } ]);
    expect(this.collection.canGeocode()).toBeTruthy();
  });

  it('should return the failed items', function() {
    expect(this.collection.failedItems()).toEqual([]);
    // Add three of which one is failed
    this.collection.reset([ {}, { state: 'failed' }, {} ]);
    expect(this.collection.failedItems().length).toEqual(1);
  });
});
