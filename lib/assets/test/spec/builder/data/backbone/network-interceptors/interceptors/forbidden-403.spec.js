var ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
var URLFunctions = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403').URLFunctions;

describe('data/backbone/network-interceptors/interceptors/forbidden-403', function () {
  var action;

  beforeEach(function () {
    action = ForbiddenAction();
    spyOn(URLFunctions, 'redirectTo');
    spyOn(URLFunctions, 'getRedirectURL').and.callThrough();
  });

  it('should do nothing if error status is not 403', function () {
    action({ status: 404 });
    expect(URLFunctions.redirectTo).not.toHaveBeenCalled();
  });

  it('should redirect to login if error response contains `session_expired`', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'session_expired'
      }
    });
    expect(URLFunctions.redirectTo).toHaveBeenCalled();
  });

  it('should call getRedirectURL with username if provided', function () {
    var action = ForbiddenAction('username');
    action({
      status: 403,
      responseJSON: {
        error: 'session_expired'
      }
    });
    expect(URLFunctions.getRedirectURL).toHaveBeenCalledWith(window.location.origin, 'username');
  });

  describe('.getRedirectURL', function () {
    it('should return URL with /login with the current URL if no username is provided', function () {
      expect(URLFunctions.getRedirectURL('http://test.carto.com')).toBe('http://test.carto.com/login?error=session_expired');
    });

    it('should return current URL with username replaced if username is provided', function () {
      expect(URLFunctions.getRedirectURL('http://test-user.carto.com', 'username')).toBe('http://username.carto.com/login?error=session_expired');
    });
  });
});
