var QueryBaseModel = require('builder/data/query-base-model');
var STATUS = require('builder/data/query-base-status');

describe('data/query-base-model', function () {
  var model;

  var createModelFn = function (options) {
    QueryBaseModel.prototype._onChange = function () {};
    QueryBaseModel.prototype._getSqlApiQueryParam = function () {};

    return new QueryBaseModel(options);
  };

  beforeEach(function () {
    model = createModelFn({
      status: 'test'
    });
  });

  describe('.initialize', function () {
    it('should have 0 repeated errors', function () {
      expect(model.repeatedErrors).toEqual(0);
    });
  });

  describe('.getStatusValue', function () {
    it('should return the current status', function () {
      expect(model.getStatusValue()).toEqual('test');
    });
  });

  describe('.isInInitialStatus', function () {
    it('should return true if the status is initial', function () {
      model = createModelFn({
        status: STATUS.initial
      });

      expect(model.isInInitialStatus()).toEqual(true);
    });

    it('should return false if the status is not initial', function () {
      model = createModelFn({
        status: STATUS.fetched
      });

      expect(model.isInInitialStatus()).toEqual(false);
    });
  });

  describe('.isInFinalStatus', function () {
    it('should return true if the status is fetched', function () {
      model = createModelFn({
        status: STATUS.fetched
      });

      expect(model.isInFinalStatus()).toEqual(true);
    });

    it('should return true if the status is unavailable', function () {
      model = createModelFn({
        status: STATUS.unavailable
      });

      expect(model.isInFinalStatus()).toEqual(true);
    });

    it('should return true if the status is errored', function () {
      model = createModelFn({
        status: STATUS.errored
      });

      expect(model.isInFinalStatus()).toEqual(true);
    });

    it('should return false if the status is not unavailable, errored or fetched', function () {
      model = createModelFn({
        status: 'test'
      });

      expect(model.isInFinalStatus()).toEqual(false);
    });
  });

  describe('.isFetched', function () {
    it('should return false if the status is not fetched', function () {
      expect(model.isFetched()).toEqual(false);
    });

    it('should return true if the status is fetched', function () {
      model = createModelFn({
        status: STATUS.fetched
      });

      expect(model.isFetched()).toEqual(true);
    });
  });

  describe('.isFetching', function () {
    it('should return false if the status is not fetching', function () {
      expect(model.isFetching()).toEqual(false);
    });

    it('should return true if the status is fetching', function () {
      model = createModelFn({
        status: STATUS.fetching
      });

      expect(model.isFetching()).toEqual(true);
    });
  });

  describe('.isErrored', function () {
    it('should return false if the status is not errored', function () {
      expect(model.isErrored()).toEqual(false);
    });

    it('should return true if the status is errored', function () {
      model = createModelFn({
        status: STATUS.errored
      });

      expect(model.isErrored()).toEqual(true);
    });
  });

  describe('.isUnavailable', function () {
    it('should return false if the status is not unavailable', function () {
      expect(model.isUnavailable()).toEqual(false);
    });

    it('should return true if the status is unavailable', function () {
      model = createModelFn({
        status: STATUS.unavailable
      });

      expect(model.isUnavailable()).toEqual(true);
    });
  });

  describe('.isDone', function () {
    it('should return false neither fetched nor errored', function () {
      expect(model.isDone()).toEqual(false);
    });

    it('should return true if the status is fetched', function () {
      model = createModelFn({
        status: STATUS.fetched
      });

      expect(model.isDone()).toEqual(true);
    });

    it('should return true if the status is errored', function () {
      model = createModelFn({
        status: STATUS.errored
      });

      expect(model.isDone()).toEqual(true);
    });
  });

  describe('.hasQuery', function () {
    it('should return false if the model has not a query', function () {
      expect(model.hasQuery()).toEqual(false);
    });

    it('should return true if the model has a query', function () {
      model = createModelFn({
        query: {}
      });
      expect(model.hasQuery()).toEqual(true);
    });
  });

  describe('.canFetch', function () {
    it('should return false if the model has not a query', function () {
      model = createModelFn({
        ready: true,
        query: null
      });

      expect(model.canFetch()).toEqual(false);
    });

    it('should return false if the model is not ready', function () {
      model = createModelFn({
        ready: false,
        query: {}
      });

      expect(model.canFetch()).toEqual(false);
    });

    it('should return true if the model has a query an it is ready', function () {
      model = createModelFn({
        ready: true,
        query: {}
      });

      expect(model.canFetch()).toEqual(true);
    });
  });

  describe('.shouldFetch', function () {
    it('should return true if the model can fetch and is neither fetched nor fetching', function () {
      spyOn(model, 'canFetch').and.returnValue(true);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(false);

      expect(model.shouldFetch()).toEqual(true);
    });

    it('should return false if the model can not fetch', function () {
      spyOn(model, 'canFetch').and.returnValue(false);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(false);

      expect(model.shouldFetch()).toEqual(false);
    });

    it('should return false if the model is fetched', function () {
      spyOn(model, 'canFetch').and.returnValue(true);
      spyOn(model, 'isFetched').and.returnValue(true);
      spyOn(model, 'isFetching').and.returnValue(false);

      expect(model.shouldFetch()).toEqual(false);
    });

    it('should return false if the model is fetching', function () {
      spyOn(model, 'canFetch').and.returnValue(true);
      spyOn(model, 'isFetched').and.returnValue(false);
      spyOn(model, 'isFetching').and.returnValue(true);

      expect(model.shouldFetch()).toEqual(false);
    });
  });

  describe('.resetFetch', function () {
    it('should set the status to unfetched', function () {
      model.resetFetch();
      expect(model.get('status')).toEqual(STATUS.unfetched);
    });
  });

  describe('.isNew', function () {
    it('should be overwritten to always return true', function () {
      expect(model.isNew()).toEqual(true);
    });
  });

  describe('.hasRepeatedErrors', function () {
    var MAX_REPEATED_ERRORS = 2;

    it('should return false if it has less errors than errors allowed', function () {
      expect(model.hasRepeatedErrors()).toEqual(false);
    });

    it('should return true if it has more errors than errors allowed', function () {
      model.repeatedErrors = MAX_REPEATED_ERRORS + 1;
      expect(model.hasRepeatedErrors()).toEqual(true);
    });
  });

  describe('._onStatusChanged', function () {
    it('should call _onStatusChanged if status changes', function () {
      var onStatusChangedSpy = spyOn(QueryBaseModel.prototype, '_onStatusChanged').and.returnValue(true);

      model = createModelFn({
        status: STATUS.fetching
      });

      model.set('status', STATUS.fetched);

      expect(onStatusChangedSpy).toHaveBeenCalled();
    });

    it('should trigger inFinalStatus if it is in final status', function () {
      spyOn(model, 'isInFinalStatus').and.returnValue(true);
      spyOn(model, 'trigger');
      model._onStatusChanged();

      expect(model.trigger).toHaveBeenCalledWith('inFinalStatus');
    });

    it('should not trigger inFinalStatus if it is not in final status', function () {
      spyOn(model, 'isInFinalStatus').and.returnValue(false);
      spyOn(model, 'trigger');
      model._onStatusChanged();

      expect(model.trigger).not.toHaveBeenCalled();
    });
  });

  describe('._addChangeListener', function () {
    it('should call onChange if the model changes', function () {
      var onChangeSpy = spyOn(model, '_onChange').and.returnValue(true);

      model._addChangeListener();
      model.set('status', STATUS.fetched);

      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('._removeChangeListener', function () {
    it('should not call onChange if the model changes', function () {
      var onChangeSpy = spyOn(model, '_onChange').and.returnValue(true);

      model._addChangeListener();
      model._removeChangeListener();

      model.set('status', STATUS.fetched);

      expect(onChangeSpy).not.toHaveBeenCalled();
    });
  });

  describe('._httpMethod', function () {
    var MAX_GET_LENGTH = 1024;

    it('should be GET if sql api query param length is shorter tan max length allowed', function () {
      spyOn(QueryBaseModel.prototype, '_getSqlApiQueryParam').and.returnValue([]);
      expect(model._httpMethod()).toEqual('GET');
    });

    it('should be POST if sql api query param length is longer tan max length allowed', function () {
      spyOn(QueryBaseModel.prototype, '_getSqlApiQueryParam').and.returnValue(new Array(MAX_GET_LENGTH + 1));
      expect(model._httpMethod()).toEqual('POST');
    });
  });

  describe('._incrementRepeatedError', function () {
    it('should increment repeated errors in threshold by one', function () {
      model.repeatedErrors = 2;
      model._incrementRepeatedError();
      expect(model.repeatedErrors).toEqual(3);
    });
  });

  describe('._resetRepeatedError', function () {
    it('should set repeatedErrors to zero', function () {
      model.repeatedErrors = 2;
      model._resetRepeatedError();
      expect(model.repeatedErrors).toEqual(0);
    });
  });

  describe('._onReadyChanged', function () {
    it('should be called if ready property changes', function () {
      spyOn(QueryBaseModel.prototype, '_onReadyChanged').and.returnValue(true);

      model = createModelFn({
        ready: false
      });

      model.set('ready', true);

      expect(model._onReadyChanged).toHaveBeenCalled();
    });

    it('should fetch if is ready and it should fetch', function () {
      model.set('ready', true);
      spyOn(model, 'shouldFetch').and.returnValue(true);
      spyOn(model, 'fetch');

      model._onReadyChanged();

      expect(model.fetch).toHaveBeenCalled();
    });

    it('should not fetch if it is not ready', function () {
      model.set('ready', false);
      spyOn(model, 'shouldFetch').and.returnValue(true);
      spyOn(model, 'fetch');

      model._onReadyChanged();

      expect(model.fetch).not.toHaveBeenCalled();
    });

    it('should not fetch if it should not', function () {
      model.set('ready', true);
      spyOn(model, 'shouldFetch').and.returnValue(false);
      spyOn(model, 'fetch');

      model._onReadyChanged();

      expect(model.fetch).not.toHaveBeenCalled();
    });
  });
});
