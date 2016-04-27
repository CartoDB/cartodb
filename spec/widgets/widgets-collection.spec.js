var WidgetsCollection = require('../../src/widgets/widgets-collection');
var _ = require('underscore');
var Backbone = require('backbone');

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

  it('should only allow autoStyle in one layer at a time', function () {
    var m1 = this.collection.at(0);
    var m2 = this.collection.at(1);
    var m3 = this.collection.at(2);

    m1.dataviewModel = { layer: new Backbone.Model(
      {
        layer_name: 'l1'
      })
    };
    m2.dataviewModel = { layer: new Backbone.Model(
      {
        layer_name: 'l2'
      })
    };
    m3.dataviewModel = { layer: new Backbone.Model(
      {
        layer_name: 'l1'
      })
    };

    expect(m1.get('autoStyle')).toBeFalsy();
    expect(m2.get('autoStyle')).toBeUndefined();
    expect(m3.get('autoStyle')).toBeTruthy();

    m1.set('autoStyle', true);
    expect(m1.get('autoStyle')).toBeTruthy();
    expect(m2.get('autoStyle')).toBeUndefined();
    expect(m3.get('autoStyle')).toBeFalsy();

    m2.set('autoStyle', true);
    expect(m1.get('autoStyle')).toBeTruthy();
    expect(m2.get('autoStyle')).toBeTruthy();
    expect(m3.get('autoStyle')).toBeFalsy();
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
