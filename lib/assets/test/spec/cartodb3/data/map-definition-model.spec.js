var MapDefinitionModel = require('../../../../javascripts/cartodb3/data/map-definition-model');

describe('data/map-definition-model', function () {
  beforeEach(function () {
    this.model = new MapDefinitionModel({
      id: 'm-123'
    }, {
      baseUrl: '/u/pepe'
    });
  });

  it('should have a layerDefinitionsCollection', function () {
    expect(this.model.layerDefinitionsCollection).toBeDefined();
  });

  it('should provide the means for layer definition to have a proper URL', function () {
    expect(this.model.layerDefinitionsCollection.url()).toEqual('/u/pepe/api/v3/maps/m-123/layers');
  });
});
