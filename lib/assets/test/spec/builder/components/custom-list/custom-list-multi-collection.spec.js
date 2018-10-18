var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');
var CustomListCollection = require('builder/components/custom-list/custom-list-multi-collection');

describe('components/custom-list/custom-list-multi-collection', function () {
  beforeEach(function () {
    this.collection = new CustomListCollection([
      new CustomListItemModel({ val: 'hi' }),
      new CustomListItemModel({ val: 'howdy' }),
      new CustomListItemModel({ val: 'hello' })
    ]);
  });

  it('shouldn\'t remove previous selected item when a new one is chosen', function () {
    this.collection.at(1).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    this.collection.at(0).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(2);
    expect(this.collection.at(0).get('selected')).toBeTruthy();
    expect(this.collection.at(1).get('selected')).toBeTruthy();
  });
});
