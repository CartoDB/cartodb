var MapDefinitionModel = require('../../../../javascripts/cartodb3/data-models/map-definition-model');

describe('map-model', function () {
  beforeEach(function () {
    this.mapDef = new MapDefinitionModel({
      urlRoot: '/bampadam',
      id: 9000
    });
  });

  it('should have a layers collection', function () {
    expect(this.mapDef.layers).toBeDefined();
    expect(this.mapDef.layers.url()).toEqual('/bampadam/api/v3/maps/9000/layers');
  });

  it('should have a widgets collection', function () {
    expect(this.mapDef.widgets).toBeDefined();
  });
});
