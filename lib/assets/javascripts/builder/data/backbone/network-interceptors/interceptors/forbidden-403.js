/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects to login page when
 * any 403 session expired error is returned in any of the
 * network requests
 */

var LOGIN_ROUTE = '/login?error=session_expired';
var SESSION_EXPIRED = 'session_expired';

var subdomainMatch = /https?:\/\/([^.]+)/;

module.exports = function (username) {
  return function (xhr, textStatus, errorThrown) {
    if (xhr.status !== 403) return;

    var error = xhr.responseJSON && xhr.responseJSON.error;

    if (error === SESSION_EXPIRED) {
      URLFunctions.redirectTo(
        URLFunctions.getRedirectURL(window.location.origin, username)
      );
    }
  };
};

var URLFunctions = {
  getRedirectURL: function getRedirectURL (currentURLOrigin, username) {
    if (!username) {
      return currentURLOrigin + LOGIN_ROUTE;
    }

    var newURL = currentURLOrigin.replace(subdomainMatch, function () {
      return username;
    });

    return window.location.protocol + '//' + newURL + LOGIN_ROUTE;
  },

  redirectTo: function redirectTo (url) {
    window.location = url;
  }
};

module.exports.URLFunctions = URLFunctions;
