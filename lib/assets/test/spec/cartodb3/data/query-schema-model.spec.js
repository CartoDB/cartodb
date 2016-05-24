var cdb = require('cartodb.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

describe('data/query-schema-model', function () {
  beforeEach(function () {
    this.xhrSpy = jasmine.createSpyObj('xhr', ['abort', 'always', 'fail']);
    spyOn(cdb.core.Model.prototype, 'sync').and.returnValue(this.xhrSpy);
    spyOn(cdb.core.Model.prototype, 'fetch').and.callThrough();

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'xyz123'
    });
    this.model = new QuerySchemaModel(null, {
      configModel: configModel
    });

    spyOn(this.model.columnsCollection, 'reset').and.callThrough();
    spyOn(this.model.rowsSampleCollection, 'reset').and.callThrough();
  });

  describe('when there is no query set', function () {
    it('should be unavailable by default', function () {
      expect(this.model.get('status')).toEqual('unavailable');
    });

    it('should not allow to fetch', function () {
      expect(this.model.fetch());
      expect(cdb.core.Model.prototype.fetch).not.toHaveBeenCalled();
    });
  });

  describe('when a query is changed', function () {
    beforeEach(function () {
      this.model.set('query', 'SELECT * FROM foo');
    });

    it('should update status accordingly', function () {
      expect(this.model.get('status')).toEqual('unfetched');

      this.model.unset('query');
      expect(this.model.get('status')).toEqual('unavailable');
    });

    it('should reset columns', function () {
      expect(this.model.columnsCollection.reset).toHaveBeenCalled();
    });

    it('should reset rows sample', function () {
      expect(this.model.rowsSampleCollection.reset).toHaveBeenCalled();
    });

    describe('when fetch', function () {
      beforeEach(function () {
        this.model.fetch();
      });

      it('should fetch with a wrapped query', function () {
        expect(cdb.core.Model.prototype.fetch).toHaveBeenCalled();
        expect(cdb.core.Model.prototype.fetch.calls.argsFor(0)[0].data.q).toMatch(/select \* from \(.+\) /);
      });

      it('should fetch a sample of rows only', function () {
        expect(cdb.core.Model.prototype.fetch.calls.argsFor(0)[0].data.q).toMatch(/ limit \d/);
      });

      it('should fetch using an API key', function () {
        expect(cdb.core.Model.prototype.fetch.calls.argsFor(0)[0].data.api_key).toEqual('xyz123');
      });

      it('should change status', function () {
        expect(this.model.get('status')).toEqual('fetching');
      });

      describe('when a request is already ongoing', function () {
        beforeEach(function () {
          this.model.fetch();
        });

        it('should cancel current request', function () {
          expect(this.xhrSpy.abort).toHaveBeenCalled();
        });

        it('should fetch again', function () {
          expect(cdb.core.Model.prototype.fetch.calls.count()).toEqual(2);
        });
      });

      describe('when request succeeds', function () {
        beforeEach(function () {
          cdb.core.Model.prototype.sync.calls.argsFor(0)[2].success({
            fields: {
              cartodb_id: 'number',
              title: 'string',
              the_geom: 'geometry',
              the_geom_webmercator: 'geometry'
            },
            rows: [
              { cartodb_id: 1, title: '1st', the_geom: '0101000020E6100000694C88B9A4AA0DC0FD4FFEEE1D354440', the_geom_webmercator: '0101000020110F00003BA22311223219C13E88B17EF7CA5241' },
              { cartodb_id: 2, title: '2nd', the_geom: '0101000020E6100000694C88B9A4AA0DC0FD4FFEEE1D354440', the_geom_webmercator: '0101000020110F00003BA22311223219C13E88B17EF7CA5241' },
              { cartodb_id: 3, title: '3rd', the_geom: '0101000020E6100000694C88B9A4AA0DC0FD4FFEEE1D354440', the_geom_webmercator: '0101000020110F00003BA22311223219C13E88B17EF7CA5241' }
            ]
          });
        });

        it('should change status', function () {
          expect(this.model.get('status')).toEqual('fetched');
        });

        it('should reset columns', function () {
          expect(this.model.columnsCollection.pluck('name')).toEqual(['cartodb_id', 'title', 'the_geom', 'the_geom_webmercator']);
        });
        it('should reset rows', function () {
          expect(this.model.rowsSampleCollection.pluck('cartodb_id')).toEqual([1, 2, 3]);
        });
      });

      describe('when request fails', function () {
        beforeEach(function () {
          cdb.core.Model.prototype.sync.calls.argsFor(0)[2].error({
            error: 'meh'
          });
        });

        it('should have unavailable status', function () {
          expect(this.model.get('status')).toEqual('unavailable');
        });
      });
    });
  });

  describe('when may_have_rows flag is changed', function () {
    describe('when there is no query', function () {
      beforeEach(function () {
        this.model.set('may_have_rows', true);
      });

      it('should reset rows sample', function () {
        expect(this.model.rowsSampleCollection.reset).toHaveBeenCalled();
      });

      it('should change status', function () {
        expect(this.model.get('status')).toEqual('unavailable');
      });
    });

    describe('when there is a query', function () {
      beforeEach(function () {
        this.model.set({
          query: 'SELECT * FROM something',
          may_have_rows: false
        });
      });

      it('should reset rows sample', function () {
        expect(this.model.rowsSampleCollection.reset).toHaveBeenCalled();
      });

      it('should change status', function () {
        expect(this.model.get('status')).toEqual('unfetched');
      });
    });
  });

  describe('.getGeometry', function () {
    it('should return null when there are no rows sample', function () {
      expect(this.model.getGeometry()).toBeNull();
    });

    describe('when there is a rows sample', function () {
      beforeEach(function () {
        this.model.rowsSampleCollection.add({
          cartodb_id: 1,
          title: '1st',
          the_geom: '0101000020E6100000694C88B9A4AA0DC0FD4FFEEE1D354440',
          the_geom_webmercator: '0101000020110F00003BA22311223219C13E88B17EF7CA5241'
        });
      });

      it('should return a geom object', function () {
        expect(this.model.getGeometry()).toBeDefined();
      });

      it('should fall back on webmercator geom if normal geom is not available', function () {
        this.model.unset('the_geom');
        expect(this.model.getGeometry()).toBeDefined();
      });
    });
  });

  describe('.destroy', function () {
    beforeEach(function () {
      this.destroySpy = jasmine.createSpy('destroy');
      this.model.once('destroy', this.destroySpy);

      this.model.destroy();
    });

    it('should do default destroy process to cleanup bindings', function () {
      expect(this.destroySpy).toHaveBeenCalled();
    });
  });
});
