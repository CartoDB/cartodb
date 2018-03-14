var Backbone = require('backbone');
var ApiKeyModel = require('dashboard/data/api-key-model');
var ApiKeysCollection = require('dashboard/data/api-keys-collection');

var modelData = {
  name: 'fake_name',
  token: 'fake_token'
};

const addKeys = function (collection) {
  collection.add({ type: 'master' });
  collection.add({ type: 'default' });
  collection.add({ type: 'regular' });
};

describe('dashboard/data/api-key-collection', function () {
  var collection;

  beforeEach(function () {
    collection = new ApiKeysCollection({}, {
      userModel: new Backbone.Model({
        base_url: 'wadus.com'
      })
    });
  });

  it('throws an error when userModel is missing', function () {
    collection = function () {
      return new ApiKeysCollection(null, {});
    };

    expect(collection).toThrowError('userModel is required');
  });

  it('should set status to fetched when synced', function () {
    collection.trigger('sync');
    expect(collection.status).toBe('fetched');
  });

  it('should set status to errored when sync has any error', function () {
    collection.trigger('error');
    expect(collection.status).toBe('errored');
  });

  describe('._url', function () {
    it('should return URL properly', function () {
      expect(collection.url()).toBe('wadus.com/api/v3/api_keys?per_page=5&page=1');
    });
  });

  it('should add UserModel to items', function () {
    const collectionItem = collection.add(modelData);

    expect(collectionItem._userModel).toBeDefined();
    expect(collectionItem instanceof ApiKeyModel).toBe(true);
  });

  it('should add id property to item', function () {
    const parsedResponse = collection.parse({
      result: [modelData]
    });

    expect(parsedResponse[0].id).toBe(modelData.name);
  });

  describe('.getMasterKey', function () {
    it('should get master key', function () {
      addKeys(collection);
      const masterKey = collection.getMasterKey();
      expect(masterKey.get('type')).toBe('master');
    });
  });

  describe('.getDefaultKey', function () {
    it('should get default key', function () {
      addKeys(collection);
      const defaultKey = collection.getDefaultKey();
      expect(defaultKey.get('type')).toBe('default');
    });
  });

  describe('.getRegularKeys', function () {
    it('should get regular keys', function () {
      addKeys(collection);
      const regularKeys = collection.getRegularKeys();
      expect(regularKeys.length).toBe(1);
      expect(regularKeys[0].get('type')).toBe('regular');
    });
  });
});
