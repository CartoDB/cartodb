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
    });

    describe('when query is available', function () {
      beforeEach(function () {
        this.model.set('query', 'SELECT * FROM foo');
        this.firstFetchResult = this.model.fetch();
      });

      it('should be fetching', function () {
        expect(this.model.get('status')).toEqual('fetching');
      });

      it('should return cached result', function () {
        expect(this.model.fetch()).toBe(this.firstFetchResult);
      });

      describe('once response returns', function () {
        beforeEach(function () {
          // fake response parsed
          this.model.set(this.model.parse({
            fields: {
              cartodb_id: 'number',
              title: 'string'
            }
          }));
        });

        it('should be set to fetched', function () {
          expect(this.model.get('status')).toEqual('fetched');
        });

        it('should return cached result', function () {
          expect(this.model.fetch()).toBe(this.firstFetchResult);
        });

        it('should reset columns', function () {
          expect(this.model.columnsCollection.pluck('name')).toEqual(['cartodb_id', 'title']);
        });
      });
    });
  });
});
