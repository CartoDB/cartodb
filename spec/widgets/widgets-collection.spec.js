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
      {order: 0, isColorsApplied: false},
      {order: 1},
      {order: 2, isColorsApplied: true}
    ]);
  });

  it('should only allow applying colors in one widget at a time', function () {
    var m1 = this.collection.at(0);
    var m2 = this.collection.at(1);
    var m3 = this.collection.at(2);

    expect(m1.get('isColorsApplied')).toBeFalsy();
    expect(m2.get('isColorsApplied')).toBeUndefined();
    expect(m3.get('isColorsApplied')).toBeTruthy();

    m1.set('isColorsApplied', true);
    expect(m1.get('isColorsApplied')).toBeTruthy();
    expect(m2.get('isColorsApplied')).toBeUndefined();
    expect(m3.get('isColorsApplied')).toBeFalsy();
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
