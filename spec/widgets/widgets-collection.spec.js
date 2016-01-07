var WidgetsCollection = require('../../src/widgets/widgets-collection');

describe('widgets/widgets-collection', function () {
  beforeEach(function () {
    this.collection = new WidgetsCollection();
    this.collection.reset([
      {isColorsApplied: false},
      {},
      {isColorsApplied: true}
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
});
