var ConfigModel = require('builder/data/config-model');
var UserNotifications = require('builder/data/user-notifications');

describe('data/user-notifications', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._notifications = {
      test: 1234
    };

    this.model = new UserNotifications(this._notifications, {
      key: 'my_category',
      configModel: configModel
    });
  });

  it('should populate the notifications', function () {
    expect(this.model.get('notifications')).toEqual(this._notifications);
  });

  it('should use the category provided', function () {
    expect(this.model.get('key')).toEqual('my_category');
  });

  it('should store a key', function () {
    expect(this.model.setKey('hi', 'test'));
    expect(this.model.get('notifications').hi).toBe('test');
  });

  it('should retrieve a key', function () {
    expect(this.model.getKey('test')).toBe(1234);
  });
});
