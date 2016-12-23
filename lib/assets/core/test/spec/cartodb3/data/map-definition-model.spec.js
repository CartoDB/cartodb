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
    this.layerDefinitionsCollection.getBaseLayer = function () {
      return true;
    };

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

  it('should save maxZoom and minZoom when a new basemap is set', function () {
    var baseLayer = new Backbone.Model({
      minZoom: 0,
      maxZoom: 40
    });
    spyOn(this.layerDefinitionsCollection, 'getBaseLayer').and.returnValue(baseLayer);
    spyOn(this.model, 'save');
    expect(this.model.get('minZoom')).toBeUndefined();
    expect(this.model.get('maxZoom')).toBeUndefined();
    this.layerDefinitionsCollection.trigger('baseLayerChanged');
    expect(this.model.save).toHaveBeenCalledWith(jasmine.objectContaining({ minZoom: 0, maxZoom: 40 }));
  });
});
