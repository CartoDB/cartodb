var _ = require('underscore');
var Backbone = require('backbone');
var DataviewsFactory = require('../../../src/dataviews/dataviews-factory');
var MockFactory = require('../../helpers/mockFactory');
var createEngine = require('../fixtures/engine.fixture.js');

var source = MockFactory.createAnalysisModel({ id: 'a0' });

var generateFakeAttributes = function (attrNames) {
  return _.reduce(attrNames, function (object, attributeName) {
    object[attributeName] = attributeName === 'source'
      ? source
      : 'something';
    return object;
  }, {});
};

var createMapMock = function () {
  var map = jasmine.createSpyObj('map', ['getViewBounds', 'on']);
  map.getViewBounds.and.returnValue([[40.6, -3.5], [40.3, -3.8]]);

  return map;
};

describe('dataviews/dataviews-factory', function () {
  beforeEach(function () {
    this.dataviewsCollection = new Backbone.Collection();
    this.factory = new DataviewsFactory(null, {
      map: createMapMock(),
      engine: createEngine(),
      dataviewsCollection: this.dataviewsCollection
    });
  });

  it('should create the factory as expected', function () {
    expect(this.factory).toBeDefined();
    expect(this.factory.createCategoryModel).toEqual(jasmine.any(Function));
    expect(this.factory.createFormulaModel).toEqual(jasmine.any(Function));
    expect(this.factory.createHistogramModel).toEqual(jasmine.any(Function));
  });

  var FACTORY_METHODS_AND_REQUIRED_ATTRIBUTES = [
    ['createCategoryModel', ['source', 'column']],
    ['createFormulaModel', ['source', 'column', 'operation']],
    ['createHistogramModel', ['source', 'column']]
  ];

  _.each(FACTORY_METHODS_AND_REQUIRED_ATTRIBUTES, function (element) {
    var factoryMethod = element[0];
    var requiredAttributes = element[1];

    it(factoryMethod + ' should throw an error if required attributes are not set', function () {
      expect(function () {
        this.factory[factoryMethod]({});
      }.bind(this)).toThrowError(requiredAttributes[0] + ' is required');
    });

    it(factoryMethod + ' should set the engine to get the apiKey attribute on the dataview', function () {
      this.factory = new DataviewsFactory({}, {
        map: createMapMock(),
        engine: createEngine(),
        dataviewsCollection: this.dataviewsCollection
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](attributes);

      expect(model._engine.getApiKey()).toEqual('API_KEY');
    });

    it(factoryMethod + ' should set the engine to get the authToken attribute on the dataview', function () {
      var engine = createEngine({ apiKey: null });
      this.factory = new DataviewsFactory({}, {
        map: createMapMock(),
        engine: engine,
        dataviewsCollection: this.dataviewsCollection
      });

      var attributes = generateFakeAttributes(requiredAttributes);
      var model = this.factory[factoryMethod](attributes);

      expect(model._engine.getAuthToken()).toEqual(engine.getAuthToken());
    });
  }, this);
});
