var _ = require('underscore');
var Backbone = require('backbone');
var LayerContentModel = require('cartodb3/data/layer-content-model');
var ConfigModel = require('cartodb3/data/config-model');
var QueryRowsCollection = require('cartodb3/data/query-rows-collection');
var STATES = require('cartodb3/data/query-base-status');

describe('data/layer-content-model', function () {
  var model;
  var configModel;
  var querySchemaModel;
  var queryGeometryModel;
  var queryRowsCollection;

  var createModelFn = function (options) {
    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    querySchemaModel = new Backbone.Model({
      status: STATES.unavailable,
      query: 'select * from wadus'
    });

    querySchemaModel.hasRepeatedErrors = function () {
      return false;
    };

    querySchemaModel.isFetching = function () {
      return false;
    };

    querySchemaModel.isFetched = function () {
      return false;
    };

    queryGeometryModel = new Backbone.Model({
      status: STATES.unavailable
    });

    queryGeometryModel.hasRepeatedErrors = function () {
      return false;
    };

    queryGeometryModel.isFetching = function () {
      return false;
    };

    queryGeometryModel.isFetched = function () {
      return false;
    };

    queryRowsCollection = new QueryRowsCollection([{
      cartodb_id: 1,
      description: 'hello guys'
    }], {
      querySchemaModel: querySchemaModel,
      configModel: configModel
    });

    queryRowsCollection.hasRepeatedErrors = function () {
      return false;
    };

    queryRowsCollection.isFetching = function () {
      return false;
    };

    queryRowsCollection.isFetched = function () {
      return false;
    };

    defaultOptions = {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    };

    return new LayerContentModel({}, _.extend(defaultOptions, options));
  };

  describe('_initBinds', function () {
    var setStateSpy;

    beforeEach(function () {
      setStateSpy = spyOn(LayerContentModel.prototype, '_setState').and.returnValue(true);
      model = createModelFn();
    });

    it('should call _setState if querySchemaModel status has been changed', function () {
      querySchemaModel.set('status', STATES.fetching);
      expect(setStateSpy).toHaveBeenCalled();
    });

    it('should call _setState if queryGeometryModel status has been changed', function () {
      queryGeometryModel.set('status', STATES.fetching);
      expect(setStateSpy).toHaveBeenCalled();
    });

    it('should call _setState if queryRowsCollection.statusModel status has been changed', function () {
      queryRowsCollection.statusModel.set('status', STATES.fetching);
      expect(setStateSpy).toHaveBeenCalled();
    });
  });

  describe('_isErrored', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should be true if _querySchemaModel has errors', function () {
      querySchemaHasRepeatedErrorsSpy = spyOn(querySchemaModel, 'hasRepeatedErrors').and.returnValue(true);
      queryGeometryHasRepeatedErrorsSpy = spyOn(queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      queryRowsCollectionHasRepeatedErrorsSpy = spyOn(queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model._isErrored()).toBe(true);
    });

    it('should be true if _queryGeometryModel has errors', function () {
      querySchemaHasRepeatedErrorsSpy = spyOn(querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      queryGeometryHasRepeatedErrorsSpy = spyOn(queryGeometryModel, 'hasRepeatedErrors').and.returnValue(true);
      queryRowsCollectionHasRepeatedErrorsSpy = spyOn(queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model._isErrored()).toBe(true);
    });

    it('should be true if _queryRowsCollection has errors', function () {
      querySchemaHasRepeatedErrorsSpy = spyOn(querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      queryGeometryHasRepeatedErrorsSpy = spyOn(queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      queryRowsCollectionHasRepeatedErrorsSpy = spyOn(queryRowsCollection, 'hasRepeatedErrors').and.returnValue(true);

      expect(model._isErrored()).toBe(true);
    });

    it('should be false if any model has errors', function () {
      querySchemaHasRepeatedErrorsSpy = spyOn(querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      queryGeometryHasRepeatedErrorsSpy = spyOn(queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      queryRowsCollectionHasRepeatedErrorsSpy = spyOn(queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model._isErrored()).toBe(false);
    });
  });

  describe('_isFetching', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should be false if _querySchemaModel is not fetching', function () {
      querySchemaIsFetchingSpy = spyOn(querySchemaModel, 'isFetching').and.returnValue(false);
      queryGeometryIsFetchingSpy = spyOn(queryGeometryModel, 'isFetching').and.returnValue(true);
      queryRowsCollectionIsFetchingSpy = spyOn(queryRowsCollection, 'isFetching').and.returnValue(true);

      expect(model._isFetching()).toBe(false);
    });

    it('should be false if _queryGeometryModel is not fetching', function () {
      querySchemaIsFetchingSpy = spyOn(querySchemaModel, 'isFetching').and.returnValue(true);
      queryGeometryIsFetchingSpy = spyOn(queryGeometryModel, 'isFetching').and.returnValue(false);
      queryRowsCollectionIsFetchingSpy = spyOn(queryRowsCollection, 'isFetching').and.returnValue(true);

      expect(model._isFetching()).toBe(false);
    });

    it('should be false if _queryRowsCollection is not fetching', function () {
      querySchemaIsFetchingSpy = spyOn(querySchemaModel, 'isFetching').and.returnValue(true);
      queryGeometryIsFetchingSpy = spyOn(queryGeometryModel, 'isFetching').and.returnValue(true);
      queryRowsCollectionIsFetchingSpy = spyOn(queryRowsCollection, 'isFetching').and.returnValue(false);

      expect(model._isFetching()).toBe(false);
    });

    it('should be true if all the models are fetching', function () {
      querySchemaIsFetchingSpy = spyOn(querySchemaModel, 'isFetching').and.returnValue(true);
      queryGeometryIsFetchingSpy = spyOn(queryGeometryModel, 'isFetching').and.returnValue(true);
      queryRowsCollectionIsFetchingSpy = spyOn(queryRowsCollection, 'isFetching').and.returnValue(true);

      expect(model._isFetching()).toBe(true);
    });
  });

  describe('_isFetched', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should be false if _querySchemaModel is not fetched', function () {
      querySchemaIsFetchedSpy = spyOn(querySchemaModel, 'isFetched').and.returnValue(false);
      queryGeometryIsFetchedSpy = spyOn(queryGeometryModel, 'isFetched').and.returnValue(true);
      queryRowsCollectionIsFetchedSpy = spyOn(queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model._isFetched()).toBe(false);
    });

    it('should be false if _queryGeometryModel is not fetched', function () {
      querySchemaIsFetchedSpy = spyOn(querySchemaModel, 'isFetched').and.returnValue(true);
      queryGeometryIsFetchedSpy = spyOn(queryGeometryModel, 'isFetched').and.returnValue(false);
      queryRowsCollectionIsFetchedSpy = spyOn(queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model._isFetched()).toBe(false);
    });

    it('should be false if _queryRowsCollection is not fetched', function () {
      querySchemaIsFetchedSpy = spyOn(querySchemaModel, 'isFetched').and.returnValue(true);
      queryGeometryIsFetchedSpy = spyOn(queryGeometryModel, 'isFetched').and.returnValue(true);
      queryRowsCollectionIsFetchedSpy = spyOn(queryRowsCollection, 'isFetched').and.returnValue(false);

      expect(model._isFetched()).toBe(false);
    });

    it('should be true if all the models are fetched', function () {
      querySchemaIsFetchedSpy = spyOn(querySchemaModel, 'isFetched').and.returnValue(true);
      queryGeometryIsFetchedSpy = spyOn(queryGeometryModel, 'isFetched').and.returnValue(true);
      queryRowsCollectionIsFetchedSpy = spyOn(queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model._isFetched()).toBe(true);
    });
  });

  describe('_setState', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should set "error" state if models have errors', function () {
      spyOn(model, '_isErrored').and.returnValue(true);

      model._setState();

      expect(model.get('state')).toEqual(STATES.errored);
    });

    it('should set "fetched" if model is no errored and model is fetched', function () {
      spyOn(model, '_isErrored').and.returnValue(false);
      spyOn(model, '_isFetched').and.returnValue(true);

      model._setState();

      expect(model.get('state')).toEqual(STATES.fetched);
    });

    it('should set "fetched" if model is no errored and model is not fetched', function () {
      spyOn(model, '_isErrored').and.returnValue(false);
      spyOn(model, '_isFetched').and.returnValue(false);

      model._setState();

      expect(model.get('state')).toEqual(STATES.fetching);
    });
  });

  describe('model states', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should have a method that returns true if it has an error state', function () {
      model.set('state', STATES.errored);
      expect(model.isErrored()).toBe(true);
    });

    it('should have a method that returns true if it is fetching', function () {
      model.set('state', STATES.fetching);
      expect(model.isFetching()).toBe(true);
    });

    it('should have a method that returns true if it is fetched', function () {
      model.set('state', STATES.fetched);
      expect(model.isFetched()).toBe(true);
    });

    it('should have a method that returns if the model is done', function () {
      model.set('state', STATES.fetched);
      expect(model.isDone()).toBe(true);

      model.set('state', STATES.errored);
      expect(model.isDone()).toBe(true);

      model.set('state', STATES.fetching);
      expect(model.isDone()).toBe(false);
    });
  });

  describe('isDataEmpty', function () {
    it('should be able to check if there is data', function () {
      model = createModelFn();

      expect(model.isDataEmpty()).toBe(false);
    });

    it('should be able to check if there is no data', function () {
      queryRowsCollection = new QueryRowsCollection([], {
        querySchemaModel: querySchemaModel,
        configModel: configModel
      });

      model = createModelFn({queryRowsCollection: queryRowsCollection});
      expect(model.isDataEmpty()).toBe(true);
    });
  });
});
