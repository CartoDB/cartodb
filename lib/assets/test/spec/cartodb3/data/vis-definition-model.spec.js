var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');

describe('data/vis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new VisDefinitionModel({
      id: 'v-123',
      map_id: 'm-123'
    }, {
      configModel: configModel
    });
  });

  it('should have a url', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/viz/v-123');
  });
});
