var MapDefinitionModel = require('../../../../javascripts/cartodb3/data-models/map-definition-model');

describe('map-definition-model', function () {
  beforeEach(function () {
    this.mapDef = new MapDefinitionModel({
      urlRoot: '/bampadam',
      id: 9000
    });
  });

  it('should have a layerDefinitions collection', function () {
    expect(this.mapDef.layerDefinitions).toBeDefined();
    expect(this.mapDef.layerDefinitions.url()).toEqual('/bampadam/api/v3/maps/9000/layers');
  });

  it('should have a widgetDefinitions collection', function () {
    expect(this.mapDef.widgetDefinitions).toBeDefined();
  });
});
