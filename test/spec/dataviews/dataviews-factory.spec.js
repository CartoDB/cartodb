var _ = require('underscore');
var Backbone = require('backbone');
var DataviewsFactory = require('../../../src/dataviews/dataviews-factory');

describe('dataviews/dataviews-factory', function () {
  beforeEach(function () {
    this.dataviewsCollection = new Backbone.Collection();
    this.layers = new Backbone.Collection();
    this.factory = new DataviewsFactory(null, {
      dataviewsCollection: this.dataviewsCollection,
      layersCollection: this.layers,
      map: {},
      windshaftMap: {}
    });
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
      var layer = jasmine.createSpyObj('layer', ['getDataProvider']);

      expect(function () {
        this.factory[factoryMethod](layer, {});
      }.bind(this)).toThrowError(requiredAttributes[0] + ' is required');
    });

    it(factoryMethod + ' should set the apiKey attribute on the dataview if present', function () {
      this.factory = new DataviewsFactory({
        apiKey: 'THE_API_KEY'
      }, {
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layers,
        map: {},
        windshaftMap: {}
      });

      var layer = jasmine.createSpyObj('layer', ['getDataProvider']);

      // Set fake attributes
      var attributes = _.reduce(requiredAttributes, function (object, attributeName) {
        object[attributeName] = 'something';
        return object;
      }, {});
      var model = this.factory[factoryMethod](layer, attributes);

      expect(model.get('apiKey')).toEqual('THE_API_KEY');
    });
  }, this);
});
