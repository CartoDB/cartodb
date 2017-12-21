var MosaicItemModel = require('../../../../../javascripts/cartodb3/components/mosaic/mosaic-item-model');
var MosaicCollection = require('../../../../../javascripts/cartodb3/components/mosaic/mosaic-collection');

describe('components/mosaic/mosaic-collection', function () {
  beforeEach(function () {
    this.collection = new MosaicCollection([
      new MosaicItemModel({ val: 'hi' }),
      new MosaicItemModel({ val: 'howdy' }),
      new MosaicItemModel({ val: 'hello' })
    ]);
  });

  it('should remove previous selected item when a new one is chosen', function () {
    this.collection.at(1).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    this.collection.at(0).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    expect(this.collection.at(1).get('selected')).toBeFalsy();
  });
});
