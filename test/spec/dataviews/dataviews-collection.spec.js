var Backbone = require('backbone');
var DataviewsCollection = require('../../../src/dataviews/dataviews-collection');
var DataviewModel = require('../../../src/dataviews/dataview-model-base');

describe('dataviews/dataview-collection', function () {
  beforeEach(function () {
    this.collection = new DataviewsCollection();
  });

  it('should remove item when removed', function () {
    var map = jasmine.createSpyObj('map', ['getViewBounds', 'off']);
    map.getViewBounds.and.returnValue([[0, 0], [0, 0]]);
    var layer = new Backbone.Model();
    layer.getDataProvider = function () {};
    var dataviewModel = new DataviewModel(null, {
      map: map,
      layer: layer
    });
    this.collection.add(dataviewModel);
    expect(this.collection.length).toEqual(1);
    this.collection.first().remove();
    expect(this.collection.length).toEqual(0);
  });
});
