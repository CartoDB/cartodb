/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects to login page when
 * any 403 session expired error is returned in any of the
 * network requests
 */

var DEFAULT_ROUTE = '/login';
var LOGIN_ROUTE = '/login?error=session_expired';
var SESSION_EXPIRED = 'session_expired';
var MFA_REQUIRED = 'mfa_required';
var MFA_ROUTE = '/multifactor_authentication';

var subdomainMatch = /https?:\/\/([^.]+)/;

var redirectRoutes = {}
redirectRoutes[SESSION_EXPIRED] = LOGIN_ROUTE;
redirectRoutes[MFA_REQUIRED] = MFA_ROUTE;

module.exports = function (username) {
  return function (xhr, textStatus, errorThrown) {
    if (xhr.status !== 403) return;

    var error = xhr.responseJSON && xhr.responseJSON.error;
    var route = redirectRoutes[error] || DEFAULT_ROUTE;

    URLFunctions.redirectTo(
      URLFunctions.getRedirectURL(window.location.origin, route, username)
    );
  };
};

var URLFunctions = {
  getRedirectURL: function getRedirectURL (currentURLOrigin, route, username) {
    if (!username) {
      return currentURLOrigin + route;
    }

    var newURL = currentURLOrigin.replace(subdomainMatch, function () {
      return username;
    });

    return window.location.protocol + '//' + newURL + route;
  },

  redirectTo: function redirectTo (url) {
    window.location = url;
  }
};

module.exports.URLFunctions = URLFunctions;
