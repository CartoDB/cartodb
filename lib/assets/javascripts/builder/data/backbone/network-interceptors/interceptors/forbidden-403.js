/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects 403 errors
 * to their corresponding routes
 */

const LOGIN_ROUTE = '/login?error=session_expired';
const SESSION_EXPIRED = 'session_expired';
const MFA_REQUIRED = 'mfa_required';
const MFA_ROUTE = '/multifactor_authentication';
const MAINTENANCE_MODE = 'maintenance_mode';
const MAINTENANCE_MODE_ROUTE = '/maintenance_mode';
const LOCKOUT = 'lockout';
const LOCKOUT_ROUTE = '/lockout';
const UNVERIFIED = 'unverified';
const UNVERIFIED_ROUTE = '/unverified';

const subdomainMatch = /https?:\/\/([^.]+)/;

const redirectRoutes = {
  [SESSION_EXPIRED]: LOGIN_ROUTE,
  [MFA_REQUIRED]: MFA_ROUTE,
  [MAINTENANCE_MODE]: MAINTENANCE_MODE_ROUTE,
  [LOCKOUT]: LOCKOUT_ROUTE,
  [UNVERIFIED]: UNVERIFIED_ROUTE
};

module.exports = function (username) {
  return function (xhr, textStatus, errorThrown) {
    if (xhr.status !== 403) return;

    const error = xhr.responseJSON && xhr.responseJSON.error;
    const redirectRoute = redirectRoutes[error];

    if (!redirectRoute) {
      return;
    }

    URLFunctions.redirectTo(
      URLFunctions.getRedirectURL(window.location.origin, redirectRoute, username)
    );
  };
};

const URLFunctions = {
  getRedirectURL: function getRedirectURL (currentURLOrigin, route, username) {
    if (!username) {
      return currentURLOrigin + route;
    }

    const newURL = currentURLOrigin.replace(subdomainMatch, function () {
      return username;
    });

    return `${window.location.protocol}//${newURL}${route}`;
  },

  redirectTo: function redirectTo (url) {
    window.location = url;
  }
};

module.exports.URLFunctions = URLFunctions;
