
var ConfigModel = require('builder/data/config-model');

describe('data/config-model', function () {
  beforeEach(function () {
    this.model = new ConfigModel();
  });

  describe('.urlVersion', function () {
    beforeEach(function () {
      this.version = this.model.urlVersion();
    });

    it('should return v1 by default', function () {
      expect(this.version).toEqual('v1');
    });
  });

  describe('.getSqlApiUrl', function () {
    beforeEach(function () {
      this.url = this.model.getSqlApiUrl();
    });

    it('should return a API url', function () {
      expect(this.url).toEqual(jasmine.any(String));
      expect(this.url).toContain('/sql');
    });
  });
});
