var NotifierCollection = require('builder/components/notifier/notifier-collection.js');

describe('components/notifier/notifier-collection', function () {
  beforeEach(function () {
    this.collection = new NotifierCollection();
    this.collection.add({
      id: 'foo',
      info: 'Test'
    });
  });

  it('should add properly', function () {
    expect(this.collection.length).toBe(1);
  });

  it('should search properly', function () {
    var model = this.collection.findById('foo');
    expect(model.get('id')).toBe('foo');
  });

  it('should remove view properly', function () {
    var model = this.collection.findById('foo');
    this.collection.remove(model);
    expect(this.collection.length).toBe(0);
  });

  describe('.addNotification', function () {
    it('should add a notification if there are no other notifications with the same info', function () {
      this.collection.addNotification({
        id: 'Test 1',
        info: 'Test 1'
      });

      expect(this.collection.size()).toEqual(2);
    });

    it('should not add a notification if there is another notification with the same info', function () {
      this.collection.addNotification({
        id: 'Test 1',
        info: 'Test'
      });

      expect(this.collection.size()).toEqual(1);
    });
  });
});
