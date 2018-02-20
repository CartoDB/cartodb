var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');

describe('components/custom-list/custom-list-collection', function () {
  beforeEach(function () {
    this.collection = new CustomListCollection([
      new CustomListItemModel({ val: 'hi' }),
      new CustomListItemModel({ val: 'howdy' }),
      new CustomListItemModel({ val: 'hello' })
    ]);
  });

  it('should search properly', function () {
    expect(this.collection.search('+').size()).toBe(0);
    expect(this.collection.search('h').size()).toBe(3);
    expect(this.collection.search('he').size()).toBe(1);
    expect(this.collection.search('/').size()).toBe(0);
  });

  it('should remove previous selected item when a new one is chosen', function () {
    this.collection.at(1).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    this.collection.at(0).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    expect(this.collection.at(1).get('selected')).toBeFalsy();
  });

  it('should remove any selected item', function () {
    this.collection.at(1).set('selected', true);
    this.collection.removeSelected();
    expect(this.collection.where({ selected: true }).length).toBe(0);
  });

  describe('sort', function () {
    it('should sort the collection by value', function () {
      this.collection.sortByKey('val');
      expect(this.collection.at(0).get('val')).toBe('hello');
      expect(this.collection.at(1).get('val')).toBe('hi');
      expect(this.collection.at(2).get('val')).toBe('howdy');
    });

    it('should sort the collection correctly if there is a null or an undefined value', function () {
      var collection = new CustomListCollection([
        { val: 'hi' },
        { val: 'howdy' },
        { val: 'hello' },
        { val: 'hola' },
        { val: null },
        { val: undefined }
      ]);
      collection.sortByKey('val');

      expect(collection.at(2).get('val')).toBe('hola');
      expect(collection.at(4).get('val')).toBeNull();
      expect(collection.at(5).get('val')).toBeUndefined();
    });
  });
});
