var trackJsErrors = require('new_common/track_js_errors');

describe('new_common/track_js_errors', function() {
  describe('given trackJs lib and a username', function() {
    beforeEach(function() {
      this.trackJs = jasmine.createSpyObj('trackJs', ['configure']);
      this.username = 'pepe';
      trackJsErrors(this.trackJs, this.username);
      this.configureArgs = this.trackJs.configure.calls.argsFor(0)[0];
    });

    it('should configure trackJs to log', function() {
      expect(this.trackJs.configure).toHaveBeenCalled();
    });

    it('should configured it to log the user Id as the username', function() {
      expect(this.configureArgs.userId).toEqual(this.username);
    });

    it('should configured it to not log failing AJAX calls', function() {
      expect(this.configureArgs.trackAjaxFail).toBeFalsy();
    });
  });
});
