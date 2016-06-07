var NotifierCollection = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier-collection.js');

describe('editor/components/notifier/notifier-collection', function () {
  beforeEach(function () {
    this.collection = new NotifierCollection();
    this.collection.add({
      id: 'foo'
    });
  });

  it('should add properly', function () {
    expect(this.collection.length).toBe(1);
  });

  it('should search properly', function () {
    var model = this.collection.search('foo');
    expect(model.get('id')).toBe('foo');
  });

  it('should remove view properly', function () {
    var model = this.collection.search('foo');
    this.collection.remove(model);
    expect(this.collection.length).toBe(0);
  });
});
