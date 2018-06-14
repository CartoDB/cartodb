var Backbone = require('backbone');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');

describe('data/query-rows-collection', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });
    spyOn(this.querySchemaModel, 'setError');

    spyOn(QueryRowsCollection.prototype, 'fetch').and.callThrough();

    this.collection = new QueryRowsCollection([], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
    });

    this.collection.sync = function (a, b, opts) {
      opts = opts || {};
      opts.success && opts.success();
    };
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.collection.statusModel).toBeDefined();
    });
  });

  describe('setTableName', function () {
    it('should not change tableName when it is renamed but it is not referenced', function () {
      this.collection.reset([{ id: 'hola' }]);
      expect(this.collection.at(0)._tableName).toBe(undefined);
      this.collection.setTableName('two');
      expect(this.collection.at(0)._tableName).toBeUndefined();
      expect(this.collection._tableName).toBeUndefined();
    });

    it('should change tableName from itself and its children when it is renamed', function () {
      this.collection.reset([{ id: 'hola' }]);
      this.collection._tableName = 'one';
      expect(this.collection.at(0)._tableName).toBe(undefined);
      this.collection.setTableName('two');
      expect(this.collection.at(0)._tableName).toBe('two');
      expect(this.collection._tableName).toBe('two');
    });
  });

  describe('._initBinds', function () {
    it('should change status and reset data when query-schema-model query changes', function () {
      this.collection.statusModel.set('status', 'fetched');
      this.collection.reset([{ id: 'hola' }]);

      this.querySchemaModel.set('query', 'dummy query hey!');

      expect(this.collection.statusModel.get('status')).toBe('unfetched');
      expect(this.collection.size()).toBe(0);
      expect(this.collection.canFetch()).toBeFalsy();
      expect(this.collection.shouldFetch()).toBeFalsy();
    });

    it('should bind _onColumnsCollectionReset callback when "_querySchemaModel" is defined', function () {
      spyOn(this.collection, 'listenTo');

      expect(this.collection.listenTo).not.toHaveBeenCalled();

      this.collection._initBinds();

      expect(this.collection.listenTo).toHaveBeenCalledTimes(3);
    });

    it('should not bind _onColumnsCollectionReset callback when "_querySchemaModel" is not defined', function () {
      // mock querySchemaModel object
      this.collection._querySchemaModel = false;
      spyOn(this.collection, 'listenTo');

      expect(this.collection.listenTo).not.toHaveBeenCalled();

      this.collection._initBinds();

      expect(this.collection.listenTo).toHaveBeenCalledTimes(2);
    });

    it('should fetch new data when the column collection is changed', function () {
      spyOn(this.collection, 'shouldFetch').and.returnValue(true);
      spyOn(this.collection, '_onQuerySchemaQueryChange');

      expect(this.collection.fetch).not.toHaveBeenCalled();
      this.collection._querySchemaModel.columnsCollection.trigger('reset');

      expect(this.collection.fetch).toHaveBeenCalledTimes(1);
      expect(this.collection._onQuerySchemaQueryChange).toHaveBeenCalledTimes(1);
    });

    it('should not fetch new data when the column collection is changed but shouldn\'t fetch', function () {
      spyOn(this.collection, 'shouldFetch').and.returnValue(false);
      spyOn(this.collection, '_onQuerySchemaQueryChange');

      expect(this.collection.fetch).not.toHaveBeenCalled();
      this.collection._querySchemaModel.columnsCollection.trigger('reset');

      expect(this.collection.fetch).not.toHaveBeenCalled();
      expect(this.collection._onQuerySchemaQueryChange).toHaveBeenCalled();
    });
  });

  describe('.canFetch', function () {
    it('should allow to fetch if _querySchemaModel is ready and fetched, not errored, and doesn\'t have query', function () {
      this.configModel = new Backbone.Model();

      this.querySchemaModel = new QuerySchemaModel({
        query: 'SELECT * FROM table',
        ready: true
      }, {
        configModel: this.configModel
      });

      spyOn(this.querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(this.querySchemaModel, 'isErrored').and.returnValue(false);

      this.collection = new QueryRowsCollection([], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      expect(this.collection.canFetch()).toBe(true);
    });

    it('should not allow to fetch if _querySchemaModel doesn\'t have query', function () {
      this.configModel = new Backbone.Model();

      this.querySchemaModel = new QuerySchemaModel({
        ready: true
      }, {
        configModel: this.configModel
      });

      spyOn(this.querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(this.querySchemaModel, 'isErrored').and.returnValue(false);

      this.collection = new QueryRowsCollection([], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      expect(this.collection.canFetch()).toBe(false);
    });

    it('should not allow to fetch if _querySchemaModel isn\'t ready', function () {
      this.configModel = new Backbone.Model();

      this.querySchemaModel = new QuerySchemaModel({
        query: 'SELECT * FROM table',
        ready: false
      }, {
        configModel: this.configModel
      });

      spyOn(this.querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(this.querySchemaModel, 'isErrored').and.returnValue(false);

      this.collection = new QueryRowsCollection([], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      expect(this.collection.canFetch()).toBe(false);
    });

    it('should not allow to fetch if _querySchemaModel has not been already fetched', function () {
      this.configModel = new Backbone.Model();

      this.querySchemaModel = new QuerySchemaModel({
        query: 'SELECT * FROM table',
        ready: true
      }, {
        configModel: this.configModel
      });

      spyOn(this.querySchemaModel, 'isFetched').and.returnValue(false);
      spyOn(this.querySchemaModel, 'isErrored').and.returnValue(false);

      this.collection = new QueryRowsCollection([], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      expect(this.collection.canFetch()).toBe(false);
    });

    it('should not allow to fetch if _querySchemaModel is errored', function () {
      this.configModel = new Backbone.Model();

      this.querySchemaModel = new QuerySchemaModel({
        query: 'SELECT * FROM table',
        ready: true
      }, {
        configModel: this.configModel
      });

      spyOn(this.querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(this.querySchemaModel, 'isErrored').and.returnValue(true);

      this.collection = new QueryRowsCollection([], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      expect(this.collection.canFetch()).toBe(false);
    });
  });

  describe('.isDone', function () {
    describe('when status is fetched', function () {
      it('should return true', function () {
        spyOn(this.collection, 'isFetched').and.returnValue(true);
        expect(this.collection.isDone()).toBe(true);
      });
    });

    describe('when status is errored', function () {
      it('should return true', function () {
        spyOn(this.collection, 'isErrored').and.returnValue(true);
        expect(this.collection.isDone()).toBe(true);
      });
    });
  });

  describe('.isEmpty', function () {
    it('should rise an exeption if this function is called', function (done) {
      try {
        this.collection.isEmpty();
      } catch (error) {
        expect(error).toBeDefined();
        done();
      }
    });
  });

  describe('.isEmptyAsync', function () {
    describe('when collection is isInFinalStatus', function () {
      beforeEach(function () {
        spyOn(this.collection, 'isInFinalStatus').and.returnValue(true);
      });

      describe('when collection is empty', function () {
        it('should return true', function (done) {
          this.collection.isEmptyAsync()
            .then(function (response) {
              expect(response).toBe(true);
              done();
            });
        });
      });

      describe('when collection is not isInFinalStatus', function () {
        it('should return false', function (done) {
          this.collection.add({});

          this.collection.isEmptyAsync()
            .then(function (response) {
              expect(response).toBe(false);
              done();
            });
        });
      });
    });

    describe('when collection is not isInFinalStatus', function () {
      beforeEach(function () {
        spyOn(this.collection, 'isInFinalStatus').and.returnValue(false);
      });

      describe('when collection is empty', function () {
        it('should return true', function (done) {
          this.collection.isEmptyAsync()
            .then(function (response) {
              expect(response).toBe(true);
              done();
            });

          setTimeout(function () {
            this.collection.trigger('inFinalStatus');
          }.bind(this), 0);
        });
      });

      describe('when collection is not empty', function () {
        it('should return false', function (done) {
          this.collection.add({});

          this.collection.isEmptyAsync()
            .then(function (response) {
              expect(response).toBe(false);
              done();
            });

          setTimeout(function () {
            this.collection.trigger('inFinalStatus');
          }.bind(this), 0);
        });
      });
    });
  });

  describe('.isFetching', function () {
    it('should change "state" when is fetched', function () {
      expect(this.collection.isFetching()).toBeFalsy();
      this.collection.sync = function () {};
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeTruthy();
    });

    it('should change "state" when fetch has finished', function () {
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeFalsy();
      expect(this.collection.isFetched()).toBeTruthy();
    });

    it('should change "state" when fetch has failed', function () {
      this.collection.sync = function (a, b, opts) {
        opts && opts.error();
      };
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeFalsy();
      expect(this.collection.isFetched()).toBeFalsy();
    });
  });

  describe('.fetch', function () {
    it('should call _onQueryRowsCollectionError when success response has property error', function () {
      var requestResponse = {
        error: ['Postgres Error']
      };

      spyOn(Backbone.Collection.prototype, 'fetch').and.callFake(function (options) {
        options.success([], requestResponse, options);
      });

      this.collection.fetch();

      expect(this.querySchemaModel.setError).toHaveBeenCalledWith(requestResponse.error);
    });
  });

  describe('.getStatusValue', function () {
    it('should return the status', function () {
      this.collection.statusModel.set('status', 'test');
      expect(this.collection.getStatusValue()).toEqual('test');
    });
  });
});
