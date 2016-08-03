var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserNotifications = require('../../../../javascripts/cartodb3/data/user-notifications');

describe('data/user-notifications', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._notifications = {
      test: 1234
    };

    this.model = new UserNotifications(this._notifications, {
      key: 'my_key',
      configModel: configModel
    });
  });

  it('should populate the notifications', function () {
    expect(this.model.get('notifications')).toEqual(this._notifications);
  });

  it('should use the key provided', function () {
    expect(this.model.get('key')).toEqual('my_key');
  });

  it('should store a key', function () {
    expect(this.model.setKey('hi', 'test'));
    expect(this.model.get('notifications').hi).toBe('test');
  });

  it('should retrieve a key', function () {
    expect(this.model.getKey('test')).toBe(1234);
  });
});
