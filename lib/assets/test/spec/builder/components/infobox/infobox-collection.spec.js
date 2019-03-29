var InfoboxCollection = require('builder/components/infobox/infobox-collection');

describe('components/infobox/infobox-collection', function () {
  beforeEach(function () {
    this.collection = new InfoboxCollection([
      {
        state: 'idle',
        createContentView: function () {
          return 'foo';
        }
      },
      {
        state: 'error',
        createContentView: function () {
          return 'bar';
        }
      }
    ]);
  });

  it('should return the first if none selected', function () {
    var selected = this.collection.getSelected();
    var createContentView = selected.get('createContentView');
    expect(createContentView()).toBe('foo');
    expect(this.collection.at(0).get('selected')).toBe(true);
  });

  it('should have only one selected', function () {
    this.collection.at(1).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    this.collection.at(0).set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    expect(this.collection.at(1).get('selected')).toBeFalsy();
  });
});
