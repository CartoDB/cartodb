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

    describe('when called due to a save', function () {
      describe('when persisted', function () {
        beforeEach(function () {
          this.model.set('_is_persisted', true);
          expect(this.model.sync('update', this.model, this.options)).toBe(this.syncResult);
        });

        it('should do default update', function () {
          expect(cdb.core.Model.prototype.sync).toHaveBeenCalled();
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[0]).toEqual('update');
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[1]).toEqual(this.model);
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[2]).toEqual(this.options);
        });
      });

      describe('when not persisted yet', function () {
        beforeEach(function () {
          this.options.error = jasmine.createSpy('error');
          expect(this.model.sync('update', this.model, this.options)).toBe(this.syncResult);
        });

        it('should create instead of default update', function () {
          expect(cdb.core.Model.prototype.sync).toHaveBeenCalled();
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[0]).toEqual('create');
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[1]).toEqual(this.model);
        });

        it('should use custom URL w/o id', function () {
          var opts = cdb.core.Model.prototype.sync.calls.argsFor(0)[2];
          expect(opts.url).toMatch(/.+\/analyses$/);
          expect(opts.url).not.toContain('a0');
        });

        it('should mark the model as persisted', function () {
          expect(this.model.get('_is_persisted')).toBe(true);
        });

        describe('when fails to persist', function () {
          beforeEach(function () {
            cdb.core.Model.prototype.sync.calls.argsFor(0)[2].error();
          });

          it('should revert the persisted flag', function () {
            expect(this.model.get('_is_persisted')).toBeUndefined();
          });

          it('should call original error', function () {
            expect(this.options.error).toHaveBeenCalled();
          });
        });
      });
    });

    describe('when called due to a destroy', function () {
      describe('when persisted', function () {
        beforeEach(function () {
          this.model.set('_is_persisted', true);
          expect(this.model.sync('delete', this.model, this.options)).toBe(this.syncResult);
        });

        it('should do default delete', function () {
          expect(cdb.core.Model.prototype.sync).toHaveBeenCalled();
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[0]).toEqual('delete');
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[1]).toEqual(this.model);
          expect(cdb.core.Model.prototype.sync.calls.argsFor(0)[2]).toEqual(this.options);
        });
      });

      describe('when not persisted', function () {
        beforeEach(function () {
          this.result = this.model.sync('delete', this.model, this.options);
        });

        it('should do nothing', function () {
          expect(cdb.core.Model.prototype.sync).not.toHaveBeenCalled();
          expect(this.result).not.toBe(this.syncResult);
        });

        it('should return promise', function () {
          expect(this.result).toBeDefined();
          expect(this.result.then).toEqual(jasmine.any(Function));
        });
      });
    });

    describe('when called due to a destroy', function () {

    });
  });
});
