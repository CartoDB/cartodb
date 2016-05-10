var $ = require('jquery');
var cdb = require('cartodb.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

describe('data/query-schema-model', function () {
  beforeEach(function () {
    this.dfd = $.Deferred();
    spyOn(cdb.core.Model.prototype, 'fetch').and.returnValue(this.dfd.promise());

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new QuerySchemaModel(null, {
      configModel: configModel
    });
  });

  it('should be unavailable by default since there is no query', function () {
    expect(this.model.get('status')).toEqual('unavailable');
  });

  describe('when query changes', function () {
    it('should update status', function () {
      this.model.set('query', 'SELECT * FROM foo');
      expect(this.model.get('status')).toEqual('unfetched');

      this.model.unset('query');
      expect(this.model.get('status')).toEqual('unavailable');
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

  describe('.fetch', function () {
    describe('when query is not set', function () {
      beforeEach(function () {
        this.errorSpy = jasmine.createSpy('error callback');
        this.model.fetch().then(null, this.errorSpy);
      });

      it('should not try to fetch', function () {
        expect(cdb.core.Model.prototype.fetch).not.toHaveBeenCalled();
      });

      it('should return a rejected promise', function () {
        expect(this.errorSpy).toHaveBeenCalled();
      });

      it('should have unavailable status', function () {
        expect(this.model.get('status')).toEqual('unavailable');
      });
    });

    describe('when query is available', function () {
      beforeEach(function () {
        this.model.set('query', 'SELECT * FROM foo');
        this.firstFetchResult = this.model.fetch();
        this.successSpy = jasmine.createSpy('success');
        this.errorSpy = jasmine.createSpy('error');
        this.firstFetchResult
          .done(this.successSpy)
          .fail(this.errorSpy);
      });

      it('should be fetching', function () {
        expect(this.model.get('status')).toEqual('fetching');
      });

      it('should return cached result', function () {
        expect(this.model.fetch()).toBe(this.firstFetchResult);
      });

      describe('when request succeeds', function () {
        beforeEach(function () {
          // fake response parsed
          cdb.core.Model.prototype.fetch.calls.argsFor(0)[0].success();
          this.model.set(this.model.parse({
            fields: {
              cartodb_id: 'number',
              title: 'string'
            }
          }));
        });

        it('should have fetched status', function () {
          expect(this.model.get('status')).toEqual('fetched');
        });

        it('should return cached result', function () {
          expect(this.model.fetch()).toBe(this.firstFetchResult);
        });

        it('should reset columns', function () {
          expect(this.model.columnsCollection.pluck('name')).toEqual(['cartodb_id', 'title']);
        });

        it('should resolve promise', function () {
          expect(this.successSpy).toHaveBeenCalled();
          expect(this.errorSpy).not.toHaveBeenCalled();
        });
      });

      describe('when request fails', function () {
        beforeEach(function () {
          cdb.core.Model.prototype.fetch.calls.argsFor(0)[0].error('meh');
        });

        it('should have unavailable status', function () {
          expect(this.model.get('status')).toEqual('unavailable');
        });

        it('should reject promise', function () {
          expect(this.errorSpy).toHaveBeenCalled();
          expect(this.successSpy).not.toHaveBeenCalled();
        });

        it('should reset cached promise', function () {
          // to allow subsequent fetches/retries
          expect(this.model.fetch()).not.toBe(this.firstFetchResult);
        });
      });
    });
  });
});
