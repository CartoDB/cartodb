var CustomCarouselItemModel = require('../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-item-model');
var CustomCarouselCollection = require('../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-collection');

describe('components/custom-carousel/custom-carousel-collection', function () {
  beforeEach(function () {
    this.collection = new CustomCarouselCollection([
      new CustomCarouselItemModel({ val: 'hi' }),
      new CustomCarouselItemModel({ val: 'howdy' }),
      new CustomCarouselItemModel({ val: 'hello' })
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
