var Backbone = require('backbone');
var ApiKeyModel = require('dashboard/data/api-key-model');
var ApiKeysCollection = require('dashboard/data/api-keys-collection');
const apiKeysCollectionTypes = require('dashboard/data/api-keys-collection-types');

var modelData = {
  name: 'fake_name',
  token: 'fake_token'
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

  it('should set the the default REGULAR type correctly when no type param is passed as option', function () {
    collection = new ApiKeysCollection(null, {
      userModel: new Backbone.Model({
        base_url: 'wadus.com'
      })
    });

    expect(collection._type).toEqual([apiKeysCollectionTypes.REGULAR]);
  });

  it('should set the type correctly when type param is passed as option', function () {
    collection = new ApiKeysCollection(null, {
      userModel: new Backbone.Model({
        base_url: 'wadus.com'
      }),
      type: [apiKeysCollectionTypes.MASTER, apiKeysCollectionTypes.DEFAULT]
    });

    expect(collection._type).toEqual([apiKeysCollectionTypes.MASTER, apiKeysCollectionTypes.DEFAULT]);
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
      expect(collection.url()).toBe('wadus.com/api/v3/api_keys?per_page=5&page=1&type%5B%5D=regular');
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
});
