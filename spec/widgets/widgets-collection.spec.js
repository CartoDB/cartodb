var WidgetsCollection = require('../../src/widgets/widgets-collection');
var _ = require('underscore');

describe('widgets/widgets-collection', function () {
  beforeEach(function () {
    // "Removed" debounce for not conflict with tests
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });
    this.collection = new WidgetsCollection();
    spyOn(this.collection, 'sort');
    this.collection.reset([
      {order: 0, autoStyle: false},
      {order: 1},
      {order: 2, autoStyle: true}
    ]);
  });

  it('should sort the collection and trigger orderChanged event when any widget order changes', function () {
    var orderChangedSpy = jasmine.createSpy('orderChanged');
    this.collection.on('orderChanged', orderChangedSpy);
    this.collection.at(0).set('order', 3);
    this.collection.at(1).set('order', 2);
    this.collection.at(2).set('order', 1);
    expect(this.collection.sort).toHaveBeenCalled();
    expect(orderChangedSpy).toHaveBeenCalled();
  });
});
