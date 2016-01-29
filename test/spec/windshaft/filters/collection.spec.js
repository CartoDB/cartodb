var FiltersCollection = require('../../../../src/windshaft/filters/collection');
var BaseFilter = require('../../../../src/windshaft/filters/base');

describe('windshaft/filters/collection', function () {
  beforeEach(function () {
    this.collection = new FiltersCollection();
  });

  it('should remove item when removed', function () {
    this.collection.add(new BaseFilter());
    expect(this.collection.length).toEqual(1);
    this.collection.first().remove();
    expect(this.collection.length).toEqual(0);
  });
});
