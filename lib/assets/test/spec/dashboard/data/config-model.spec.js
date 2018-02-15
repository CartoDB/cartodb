var ConfigModel = require('dashboard/data/config-model');
var Backbone = require('backbone');

describe('dashboard/data/config-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel();
  });

  it('should have a modules collection', function () {
    expect(this.configModel.modules).not.toBe(undefined);
    expect(this.configModel.modules).toEqual(jasmine.any(Backbone.Collection));
  });
});
