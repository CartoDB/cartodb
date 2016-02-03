var MapDefinitionModel = require('../../../../javascripts/cartodb3/data-models/map-definition-model');

describe('map-definition-model', function () {
  beforeEach(function () {
    this.mapDef = new MapDefinitionModel({
      urlRoot: '/bampadam',
      id: 9000
    });
  });

  it('should have a layerDefinitionsCollectionCollection', function () {
    expect(this.mapDef.layerDefinitionsCollection).toBeDefined();
    expect(this.mapDef.layerDefinitionsCollection.url()).toEqual('/bampadam/api/v3/maps/9000/layers');
  });

  it('should have a widgetDefinitionsCollectionCollection', function () {
    expect(this.mapDef.widgetDefinitionsCollection).toBeDefined();
  });
});
