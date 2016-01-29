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
    expect(this.factory.createCategoryDataview).toEqual(jasmine.any(Function));
    expect(this.factory.createFormulaDataview).toEqual(jasmine.any(Function));
    expect(this.factory.createHistogramDataview).toEqual(jasmine.any(Function));
    expect(this.factory.createListDataview).toEqual(jasmine.any(Function));
  });
});
