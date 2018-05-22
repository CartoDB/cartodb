/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects to login page when
 * any 403 session expired error is returned in any of the
 * network requests
 */

var LOGIN_ROUTE = '/login';
var SESSION_EXPIRED = 'session_expired';

module.exports = function (xhr, textStatus, errorThrown) {
  if (xhr.status !== 403) return;

  var error = xhr.responseJSON && xhr.responseJSON.error;

  if (error === SESSION_EXPIRED) {
    console.warn('Redirect to password change', xhr);
    // window.location = LOGIN_ROUTE;
  }
};
