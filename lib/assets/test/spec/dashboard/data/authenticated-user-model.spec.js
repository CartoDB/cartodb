var AuthenticatedUser = require('dashboard/data/authenticated-user-model');

describe('dashboard/data/authenticated-user-model', function () {
  beforeEach(function () {
    this.model = new AuthenticatedUser({});
  });

  it('should return the normal URL', function () {
    spyOn(this.model, 'getHost').and.returnValue('test.carto.com');

    expect(this.model.url()).toBe('//test.carto.com/api/v1/get_authenticated_users');
  });
});
