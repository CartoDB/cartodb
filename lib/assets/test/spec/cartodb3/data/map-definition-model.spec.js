var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var MapDefinitionModel = require('../../../../javascripts/cartodb3/data/map-definition-model');

describe('data/map-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layerDefinitionsCollection = new Backbone.Collection();

    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.model = new MapDefinitionModel({
      id: 'm-123'
    }, {
      parse: true,
      userModel: new Backbone.Model(),
      vis: {
        map: new Backbone.Model()
      },
      configModel: configModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });
  });

  it('should have a url', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v2/maps/m-123');
  });

  it('should have a layerDefinitionsCollection', function () {
    expect(this.model._layerDefinitionsCollection).toBe(this.layerDefinitionsCollection);
  });
});
