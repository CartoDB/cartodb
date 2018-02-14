var _ = require('underscore');
var Backbone = require('backbone');
var LayerContentModel = require('cartodb3/data/layer-content-model');
var ConfigModel = require('cartodb3/data/config-model');
var QueryRowsCollection = require('cartodb3/data/query-rows-collection');

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
      status: 'unavailable',
      query: 'select * from wadus'
    });

    queryGeometryModel = new Backbone.Model({
      status: 'unavailable'
    });

    queryRowsCollection = new QueryRowsCollection([{
      cartodb_id: 1,
      description: 'hello guys'
    }], {
      querySchemaModel: querySchemaModel,
      configModel: configModel
    });

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
      querySchemaModel.set('status', 'fetching');
      expect(setStateSpy).toHaveBeenCalled();
    });

    it('should call _setState if queryGeometryModel status has been changed', function () {
      queryGeometryModel.set('status', 'fetching');
      expect(setStateSpy).toHaveBeenCalled();
    });

    it('should call _setState if queryRowsCollection.statusModel status has been changed', function () {
      queryRowsCollection.statusModel.set('status', 'fetching');
      expect(setStateSpy).toHaveBeenCalled();
    });
  });

  describe('_setState', function () {

  });

  describe('_isErrored', function () {
  });

  describe('_isFetched', function () {
  });

  describe('layer content states', function () {
  });
});
