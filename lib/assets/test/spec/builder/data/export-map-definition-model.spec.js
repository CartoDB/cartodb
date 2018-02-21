var ConfigModel = require('builder/data/config-model');
var ExportMapDefinitionModel = require('builder/data/export-map-definition-model');

describe('data/export-map-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/manolo'
    });
    this.model = new ExportMapDefinitionModel({
      visualization_id: 'v-123'
    }, {
      configModel: configModel
    });

    spyOn(this.model, 'save');
    spyOn(this.model, '_interrupt');
  });

  it('should request an export', function () {
    this.model.requestExport();

    expect(this.model.save).toHaveBeenCalled();
  });

  it('should cancel an export', function () {
    this.model.cancelExport();

    expect(this.model._interrupt).toHaveBeenCalled();
  });

  it('should have correct url', function () {
    expect(this.model.urlRoot()).toBe('/u/manolo/api/v3/visualization_exports');
  });
});
