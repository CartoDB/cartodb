var MapDefinitionModel = require('../../../../javascripts/cartodb3/data/map-definition-model');

describe('data/map-definition-model', function () {
  beforeEach(function () {
    this.layerDefinitionsCollection = {};
    this.model = new MapDefinitionModel({
      id: 'm-123'
    }, {
      baseUrl: '/u/pepe',
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });
  });

  it('should have a url', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/maps/m-123');
  });

  it('should have a layerDefinitionsCollection', function () {
    expect(this.model.layerDefinitionsCollection).toBe(this.layerDefinitionsCollection);
  });
});
