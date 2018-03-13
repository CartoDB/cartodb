var _ = require('underscore');
var LayerContentModel = require('builder/data/layer-content-model');

var getQueryGeometryModelFixture = require('fixtures/builder/query-geometry-model.fixture.js');
var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
var getQueryRowsCollectionModelFixture = require('fixtures/builder/query-rows-collection.fixture.js');

var STATES = require('builder/data/query-base-status');

var CONTEXTS = {
  map: 'map',
  table: 'table'
};

describe('data/layer-content-model', function () {
  var model;
  var defaultOptions;
  var querySchemaModel;
  var queryGeometryModel;
  var queryRowsCollection;

  var createModelFn = function (options) {
    querySchemaModel = getQuerySchemaModelFixture({
      query: ''
    });

    queryGeometryModel = getQueryGeometryModelFixture();

    queryRowsCollection = getQueryRowsCollectionModelFixture({
      querySchemaModel: querySchemaModel
    });

    defaultOptions = {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    };

    return new LayerContentModel({}, _.extend(defaultOptions, options));
  };

  beforeEach(function () {
    model = createModelFn();
  });

  describe('.initialize', function () {
    it('should have initial state by default', function () {
      expect(model.get('state')).toEqual(STATES.initial);
    });

    it('should have map context by default', function () {
      expect(model.get('context')).toEqual(CONTEXTS.map);
    });
  });

  describe('._initBinds', function () {
    it('should call to _setState when _querySchemaModel:status changes', function () {
      spyOn(model, '_setState');

      model._initBinds();
      model._querySchemaModel.trigger('change:status');
      expect(model._setState).toHaveBeenCalled();
    });

    it('should call to _setState when _queryGeometryModel:status changes', function () {
      spyOn(model, '_setState');

      model._initBinds();
      model._queryGeometryModel.trigger('change:status');
      expect(model._setState).toHaveBeenCalled();
    });

    it('should call to _setState when _queryRowsCollection.statusModel:status changes', function () {
      spyOn(model, '_setState');

      model._initBinds();
      model._queryRowsCollection.statusModel.trigger('change:status');
      expect(model._setState).toHaveBeenCalled();
    });
  });

  describe('_.getState', function () {
    it('should return initial state if it is the initial state', function () {
      spyOn(model, 'isErrored').and.returnValue(false);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(false);

      expect(model._getState()).toEqual(STATES.initial);
    });

    it('should return undefined state by default', function () {
      spyOn(model, 'isErrored').and.returnValue(false);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(false);
      spyOn(model, 'isInitial').and.returnValue(false);

      expect(model._getState()).toEqual(STATES.unavailable);
    });

    it('should return errored if it has errors', function () {
      spyOn(model, 'isErrored').and.returnValue(true);

      expect(model._getState()).toEqual(STATES.errored);
    });

    it('should return fetched if it is fetched', function () {
      spyOn(model, 'isErrored').and.returnValue(false);
      spyOn(model, 'isFetched').and.returnValue(true);

      expect(model._getState()).toEqual(STATES.fetched);
    });

    it('should return fetching if it is fetching', function () {
      spyOn(model, 'isErrored').and.returnValue(false);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(true);

      expect(model._getState()).toEqual(STATES.fetching);
    });
  });

  describe('_.setState', function () {
    it('should updated the given state by getState', function () {
      spyOn(model, '_getState').and.returnValue('final-state');

      model.set('state', 'initial-state');
      model._setState();

      expect(model.get('state')).toEqual('final-state');
    });
  });

  describe('.isErrored', function () {
    it('should be true if querySchemaModel has repeated errors', function () {
      spyOn(model._querySchemaModel, 'hasRepeatedErrors').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model.isErrored()).toEqual(true);
    });

    it('should be true if _queryGeometryModel has repeated errors', function () {
      spyOn(model._querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'hasRepeatedErrors').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model.isErrored()).toEqual(true);
    });

    it('should be true if _queryRowsCollection has repeated errors', function () {
      spyOn(model._querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'hasRepeatedErrors').and.returnValue(true);

      expect(model.isErrored()).toEqual(true);
    });

    it('should be false if any query model have errors', function () {
      spyOn(model._querySchemaModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'hasRepeatedErrors').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'hasRepeatedErrors').and.returnValue(false);

      expect(model.isErrored()).toEqual(false);
    });
  });

  describe('.isFetching', function () {
    it('should be true if querySchemaModel is fetching', function () {
      spyOn(model._querySchemaModel, 'isFetching').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'isFetching').and.returnValue(false);

      expect(model.isFetching()).toEqual(true);
    });

    it('should be true if _queryGeometryModel is fetching', function () {
      spyOn(model._querySchemaModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'isFetching').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isFetching').and.returnValue(false);

      expect(model.isFetching()).toEqual(true);
    });

    it('should be true if _queryRowsCollection is fetching', function () {
      spyOn(model._querySchemaModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'isFetching').and.returnValue(true);

      expect(model.isFetching()).toEqual(true);
    });

    it('should be false if any query model is fetching', function () {
      spyOn(model._querySchemaModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'isFetching').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'isFetching').and.returnValue(false);

      expect(model.isFetching()).toEqual(false);
    });
  });

  describe('.isFetched', function () {
    it('should be false if querySchemaModel is not fetched', function () {
      spyOn(model._querySchemaModel, 'isFetched').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model.isFetched()).toEqual(false);
    });

    it('should be false if _queryGeometryModel is not fetched', function () {
      spyOn(model._querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isFetched').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model.isFetched()).toEqual(false);
    });

    it('should be false if _queryRowsCollection is not fetched', function () {
      spyOn(model._querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isFetched').and.returnValue(false);

      expect(model.isFetched()).toEqual(false);
    });

    it('should be true if all query models are fetched', function () {
      spyOn(model._querySchemaModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isFetched').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isFetched').and.returnValue(true);

      expect(model.isFetched()).toEqual(true);
    });
  });

  describe('.isInFinalStatus', function () {
    it('should be false if querySchemaModel is not in final status', function () {
      spyOn(model._querySchemaModel, 'isInFinalStatus').and.returnValue(false);
      spyOn(model._queryGeometryModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isInFinalStatus').and.returnValue(true);

      expect(model.isInFinalStatus()).toEqual(false);
    });

    it('should be false if _queryGeometryModel is not in final status', function () {
      spyOn(model._querySchemaModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isInFinalStatus').and.returnValue(false);
      spyOn(model._queryRowsCollection, 'isInFinalStatus').and.returnValue(true);

      expect(model.isInFinalStatus()).toEqual(false);
    });

    it('should be false if _queryRowsCollection is not in final status', function () {
      spyOn(model._querySchemaModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isInFinalStatus').and.returnValue(false);

      expect(model.isInFinalStatus()).toEqual(false);
    });

    it('should be true if all query models are in final status', function () {
      spyOn(model._querySchemaModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryGeometryModel, 'isInFinalStatus').and.returnValue(true);
      spyOn(model._queryRowsCollection, 'isInFinalStatus').and.returnValue(true);

      expect(model.isInFinalStatus()).toEqual(true);
    });
  });

  describe('.isDone', function () {
    it('should be true if it is fetched', function () {
      spyOn(model, 'isFetched').and.returnValue(true);

      expect(model.isDone()).toEqual(true);
    });

    it('should be true if it is errored', function () {
      spyOn(model, 'isErrored').and.returnValue(true);

      expect(model.isDone()).toEqual(true);
    });

    it('should be false it is not fetched nor errored', function () {
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isErrored').and.returnValue(false);

      expect(model.isDone()).toEqual(false);
    });
  });
});
