var Router = require('dashboard/common/router-base');

describe('common/router', function () {
  describe('.supportTrailingSlashes', function () {
    it('should return an object with routes to callbacks that also contains the routes with trailing slashes', function () {
      var results = Router.supportTrailingSlashes({
        '': 'index',
        ':id/edit': 'editSomething'
      });
      expect(results).toEqual({
        '': 'index',
        '/': 'index',
        ':id/edit': 'editSomething',
        ':id/edit/': 'editSomething'
      });
    });
  });
});
