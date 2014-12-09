var trackJsErrors = require('new_common/track_js_errors');

describe('new_common/track_js_errors', function() {
  describe('given trackJs is not loaded', function() {
    it('should do nothing', function() {
      var userSpy = jasmine.createSpyObj('fake-User', ['get']);
      trackJsErrors(userSpy);
      expect(userSpy.get).not.toHaveBeenCalled();
    });
  });

  describe('given trackJs lib has been loaded', function() {
    beforeEach(function() {
      window.trackJs = jasmine.createSpyObj('trackJs', ['configure']);
      this.user = new cdb.admin.User({ username: 'pepe' });
      trackJsErrors(this.user);
      this.configureArgs = window.trackJs.configure.calls.argsFor(0)[0];
    });

    it('should configure trackJs to log', function() {
      expect(window.trackJs.configure).toHaveBeenCalled();
    });

    it('should configured it to log the user Id as the username', function() {
      expect(this.configureArgs.userId).toEqual('pepe');
    });

    it('should configured it to not log failing AJAX calls', function() {
      expect(this.configureArgs.trackAjaxFail).toBeFalsy();
    });

    afterEach(function() {
      delete window.trackJs;
    });
  });
});
