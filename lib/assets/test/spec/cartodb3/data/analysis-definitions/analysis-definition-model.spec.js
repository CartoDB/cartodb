var cdb = require('cartodb.js');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionModel = require('../../../../../javascripts/cartodb3/data/analysis-definitions/analysis-definition-model');

describe('data/analysis-definitions/analysis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var collection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'v-123'
    });
    this.model = new AnalysisDefinitionModel({
      id: 'a0',
      type: 'example'
    });
    collection.add(this.model);
  });

  describe('.url', function () {
    it('should return expected URL depending on if it has an id or not', function () {
      expect(this.model.url()).toMatch(/.+\/analyses\/a0/);

      this.model.unset('id');
      expect(this.model.url()).toMatch(/.+\/analyses$/);
    });
  });

  describe('.sync', function () {
    beforeEach(function () {
      this.options = {};
      this.syncResult = {};
      spyOn(cdb.core.Model.prototype, 'sync').and.returnValue(this.syncResult);
    });

    describe('when called on an update', function () {
      beforeEach(function () {
        expect(this.model.sync('update', this.model, this.options)).toBe(this.syncResult);
      });

      it('should always create on update', function () {
        expect(cdb.core.Model.prototype.sync).toHaveBeenCalled();
        expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[0]).toEqual('create');
        expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[1]).toEqual(this.model);
      });

      it('should use custom URL w/o id', function () {
        var opts = cdb.core.Model.prototype.sync.calls.argsFor(0)[2];
        expect(opts.url).toMatch(/.+\/analyses$/);
        expect(opts.url).not.toContain('a0');
      });
    });

    describe('when called on a read', function () {
      beforeEach(function () {
        expect(this.model.sync('read', this.model, this.options)).toBe(this.syncResult);
      });

      it('should just pass arguments through', function () {
        expect(cdb.core.Model.prototype.sync).toHaveBeenCalled();
        expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[0]).toEqual('read');
        expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[1]).toEqual(this.model);
        expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[2]).toEqual(this.options);
      });
    });
  });
});
