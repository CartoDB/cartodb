var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/user-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel();
    this.model = new UserModel({
      id: 'abc-123',
      base_url: '/users/pepe'
    }, {
      configModel: configModel
    });
  });

  it('should provide means for a custom URL for tables collection', function () {
    expect(this.model.tablesCollection.url()).toEqual('/users/pepe/api/v1/viz');
  });
});
