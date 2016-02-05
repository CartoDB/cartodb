var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');

describe('data/vis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel();
    this.model = new VisDefinitionModel({
      id: 'v-123',
      map_id: 'm-123'
    }, {
      configModel: configModel,
      baseUrl: '/u/pepe'
    });
  });

  it('should have a url', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/viz/v-123');
  });

  it('should have a map model', function () {
    expect(this.model.mapDefinitionModel).toBeDefined();
    expect(this.model.mapDefinitionModel.id).toEqual('m-123');
  });

  it('should provide the means for the map to create its URL', function () {
    expect(this.model.mapDefinitionModel.url()).toEqual('/u/pepe/api/v3/maps/m-123');
  });

  it('should have a widgetDefinitionsCollection', function () {
    expect(this.model.widgetDefinitionsCollection).toBeDefined();
  });
});
