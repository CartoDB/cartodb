var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var MapDefinitionModel = require('../../../../javascripts/cartodb3/data/map-definition-model');

describe('data/map-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layerDefinitionsCollection = new Backbone.Collection();
    this.model = new MapDefinitionModel({
      id: 'm-123'
    }, {
      parse: true,
      userModel: new Backbone.Model(),
      vis: {
        map: new Backbone.Model(),
        mapView: new Backbone.Model()
      },
      configModel: configModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });
  });

  it('should have a url', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/maps/m-123');
  });

  it('should have a layerDefinitionsCollection', function () {
    expect(this.model._layerDefinitionsCollection).toBe(this.layerDefinitionsCollection);
  });
});
