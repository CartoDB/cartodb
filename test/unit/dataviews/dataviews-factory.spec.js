var _ = require('underscore');
var Backbone = require('backbone');
var DataviewsFactory = require('../../../src/dataviews/dataviews-factory');

var generateFakeAttributes = function (attrNames) {
  return _.reduce(attrNames, function (object, attributeName) {
    object[attributeName] = 'something';
    return object;
  }, {});
};

describe('dataviews/dataviews-factory', function () {
  beforeEach(function () {
    this.analysisCollection = new Backbone.Collection();
    this.dataviewsCollection = new Backbone.Collection();
    this.factory = new DataviewsFactory(null, {
      map: {},
      vis: {},
      analysisCollection: this.analysisCollection,
      dataviewsCollection: this.dataviewsCollection
    });
    this.layer = new Backbone.Model();
    this.layer.getDataProvider = jasmine.createSpy('getDataProvider');
  });

  it('should create the factory as expected', function () {
    expect(this.factory).toBeDefined();
    expect(this.factory.createCategoryModel).toEqual(jasmine.any(Function));
    expect(this.factory.createFormulaModel).toEqual(jasmine.any(Function));
    expect(this.factory.createHistogramModel).toEqual(jasmine.any(Function));
    expect(this.factory.createListModel).toEqual(jasmine.any(Function));
  });

  var FACTORY_METHODS_AND_REQUIRED_ATTRIBUTES = [
    ['createCategoryModel', ['column']],
    ['createFormulaModel', ['column', 'operation']],
    ['createHistogramModel', ['column']],
    ['createListModel', ['columns']]
  ];

  _.each(FACTORY_METHODS_AND_REQUIRED_ATTRIBUTES, function (element) {
    var factoryMethod = element[0];
    var requiredAttributes = element[1];

    it(factoryMethod + ' should throw an error if required attributes are not set', function () {
      expect(function () {
        this.factory[factoryMethod](this.layer, {});
      }.bind(this)).toThrowError(requiredAttributes[0] + ' is required');
    });

    it(factoryMethod + ' should set the apiKey attribute on the dataview if present', function () {
      this.factory = new DataviewsFactory({
        apiKey: 'THE_API_KEY'
      }, {
        map: {},
        vis: {},
        analysisCollection: this.analysisCollection,
        dataviewsCollection: this.dataviewsCollection
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](this.layer, attributes);

      expect(model.get('apiKey')).toEqual('THE_API_KEY');
    });

    it(factoryMethod + " should set a default source using the layer's id when not given one", function () {
      this.factory = new DataviewsFactory({
        apiKey: 'THE_API_KEY'
      }, {
        map: {},
        vis: {},
        analysisCollection: this.analysisCollection,
        dataviewsCollection: this.dataviewsCollection
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](this.layer, attributes);

      expect(model.get('source')).toEqual({ id: this.layer.id });
    });

    it(factoryMethod + ' should set the authToken', function () {
      this.factory.set({
        authToken: 'AUTH_TOKEN'
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](this.layer, attributes);

      expect(model.get('authToken')).toEqual('AUTH_TOKEN');
    });

    it(factoryMethod + ' should set the apiKey', function () {
      this.factory.set({
        apiKey: 'API_KEY'
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](this.layer, attributes);

      expect(model.get('apiKey')).toEqual('API_KEY');
    });
  }, this);
});
