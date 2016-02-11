var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/user-model', function () {
  beforeEach(function () {
    this.model = new UserModel({
      id: 'abc-123',
      base_url: '/users/pepe'
    }, {
      tablesCollection: {}
    });
  });

  it('should have a tables collection', function () {
    expect(this.model.tablesCollection).toBeDefined();
  });
});
