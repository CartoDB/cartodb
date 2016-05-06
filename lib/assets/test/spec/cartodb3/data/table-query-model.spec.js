var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var TableQueryModel = require('../../../../javascripts/cartodb3/data/table-query-model');

describe('data/table-query-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new TableQueryModel(null, {
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
