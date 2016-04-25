var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var GeocodingsCollection = require('../../../../../javascripts/cartodb3/data/background-importer/background-importer-geocodings-collection.js');
var GeocodingModel = require('../../../../../javascripts/cartodb3/data/background-importer/geocoding-model.js');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('common/background-polling/geocodings-collection', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.vis = new cdb.vis.Vis({
      type: 'derived',
      name: 'my name'
    });

    this.vis.map = {};

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      configModel: this.configModel,
      visMap: this.vis.map,
      analysisDefinitionNodesCollection: {},
      mapId: 123
    });

    var layer = new Backbone.Model();
    layer.table = { id: 'test_table' };

    this.vis.map.layers = new Backbone.Collection([
      layer
    ]);

    GeocodingsCollection.prototype.sync = function (a, b, opts) {
      opts.success();
    };

    var user = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: this.configModel
    });

    this.collection = new GeocodingsCollection(undefined, {
      configModel: this.configModel,
      user: user,
      vis: this.vis
    });
  });

  describe('polling', function () {
    it('should start polling the geocoding model because visualization is defined and layer added to it', function () {
      this.collection.vis = this.vis;
      spyOn(this.collection, 'add');
      this.collection.parse({geocodings: [{ id: 1, table_name: 'test_table' }]});
      expect(this.collection.add).toHaveBeenCalled();
    });

    it('should not start polling the geocoding model because visualization is defined but layer is not on it', function () {
      this.collection.vis = this.vis;
      spyOn(this.collection, 'add');
      this.collection.parse({geocodings: [{ id: 1, table_name: 'hello' }]});
      expect(this.collection.add).not.toHaveBeenCalled();
    });

    it('should stop polling if there is an error in the poll checker request', function () {
      this.collection.sync = function (a, b, opts) {
        opts.error();
      };
      this.collection.pollCheck();
      expect(this.collection.pollTimer).not.toBeDefined();
    });
  });

  it('should determine if a new geocoding could be possible', function () {
    expect(this.collection.canGeocode()).toBeTruthy();

    var gm1 = new GeocodingModel(null, {
      configModel: this.configModel,
      startPollingAutomatically: false
    });

    var gm2 = new GeocodingModel({ state: 'failed' }, {
      configModel: this.configModel,
      startPollingAutomatically: false
    });

    this.collection.reset([gm1, gm2]);

    expect(this.collection.canGeocode()).toBeFalsy();
    this.collection.reset([gm2]);
    expect(this.collection.canGeocode()).toBeTruthy();
  });

  it('should return the failed items', function () {
    expect(this.collection.failedItems()).toEqual([]);
    var gm1 = new GeocodingModel(null, {
      configModel: this.configModel,
      startPollingAutomatically: false
    });

    var gm2 = new GeocodingModel({ state: 'failed' }, {
      configModel: this.configModel,
      startPollingAutomatically: false
    });

    var gm3 = new GeocodingModel(null, {
      configModel: this.configModel,
      startPollingAutomatically: false
    });

    this.collection.reset([gm1, gm2, gm3]);
    expect(this.collection.failedItems().length).toEqual(1);
  });
});
