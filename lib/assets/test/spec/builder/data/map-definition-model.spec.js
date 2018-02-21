var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var MapDefinitionModel = require('builder/data/map-definition-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');

describe('data/map-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      {
        kind: 'tiled',
        options: {
          name: 'Positron',
          category: 'CartoDB',
          minZoom: 0,
          maxZoom: 40
        }
      }
    ], {
      configModel: {},
      userModel: {},
      analysisDefinitionNodesCollection: {},
      mapId: {},
      stateDefinitionModel: {}
    });

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

  describe('when the base layer is changed', function () {
    beforeEach(function () {
      spyOn(this.model, 'save');
    });

    it('should save maxZoom and minZoom', function () {
      this.layerDefinitionsCollection.trigger('baseLayerChanged');

      expect(this.model.save).toHaveBeenCalledWith(jasmine.objectContaining({
        minZoom: 0,
        maxZoom: 40
      }));
    });

    it('should save the provider', function () {
      this.layerDefinitionsCollection.trigger('baseLayerChanged');

      expect(this.model.save).toHaveBeenCalledWith(jasmine.objectContaining({
        provider: 'leaflet'
      }));
    });

    it('should save the provider', function () {
      this.layerDefinitionsCollection.reset({
        type: 'GMapsBase',
        baseType: 'roadmap',
        minZoom: 0,
        maxZoom: 40
      }, { parse: false });

      this.layerDefinitionsCollection.trigger('baseLayerChanged');

      expect(this.model.save).toHaveBeenCalledWith(jasmine.objectContaining({
        provider: 'googlemaps'
      }));
    });
  });
});
