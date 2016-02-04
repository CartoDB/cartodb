var cdb = require('cartodb-deep-insights.js');
var Config = require('../../../../javascripts/cartodb3/top-level-apis/config');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/user-model', function () {
  beforeEach(function () {
    cdb.config = new Config();
    this.model = new UserModel({
      id: 'abc-123',
      base_url: '/users/pepe'
    });
  });

  it('should provide means for a custom URL for tables collection', function () {
    expect(this.model.tablesCollection.url()).toEqual('/users/pepe/api/v1/viz');
  });
});
