var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

describe('data/query-schema-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new QuerySchemaModel(null, {
      configModel: configModel
    });
  });

  describe('.destroy', function () {
    beforeEach(function () {
      this.destroySpy = jasmine.createSpy('destroy');
      this.model.once('destroy', this.destroySpy);

      this.model.destroy();
    });

    it('should work', function () {
      expect(this.destroySpy).toHaveBeenCalled();
    });
  });
});
