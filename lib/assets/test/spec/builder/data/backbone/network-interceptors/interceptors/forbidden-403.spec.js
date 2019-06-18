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

  it('should do nothing if error is not within defined errors', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'unknown error'
      }
    });
    expect(URLFunctions.redirectTo).not.toHaveBeenCalled();
  });

  it('should redirect to login if error response contains `session_expired`', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'session_expired'
      }
    });
    expect(URLFunctions.redirectTo).toHaveBeenCalledWith(window.location.origin + '/login?error=session_expired');
  });

  it('should redirect to multifactor_authentication if error response contains `mfa_required`', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'mfa_required'
      }
    });
    expect(URLFunctions.redirectTo).toHaveBeenCalledWith(window.location.origin + '/multifactor_authentication');
  });

  it('should redirect to maintenance_mode if error response contains `maintenance_mode`', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'maintenance_mode'
      }
    });
    expect(URLFunctions.redirectTo).toHaveBeenCalledWith(window.location.origin + '/maintenance_mode');
  });

  it('should redirect to lockout if error response contains `lockout`', function () {
    action({
      status: 403,
      responseJSON: {
        error: 'lockout'
      }
    });
    expect(URLFunctions.redirectTo).toHaveBeenCalledWith(window.location.origin + '/lockout');
  });

  it('should call getRedirectURL with username if provided', function () {
    var action = ForbiddenAction('username');
    action({
      status: 403,
      responseJSON: {
        error: 'session_expired'
      }
    });
    expect(URLFunctions.getRedirectURL).toHaveBeenCalledWith(window.location.origin, '/login?error=session_expired', 'username');
  });

  describe('.getRedirectURL', function () {
    it('should return URL with /login with the current URL if no username is provided', function () {
      expect(URLFunctions.getRedirectURL('http://test.carto.com', '/login?error=session_expired')).toBe('http://test.carto.com/login?error=session_expired');
    });

    it('should return current URL with username replaced if username is provided', function () {
      expect(URLFunctions.getRedirectURL('http://test-user.carto.com', '/login?error=session_expired', 'username')).toBe('http://username.carto.com/login?error=session_expired');
    });
  });
});
