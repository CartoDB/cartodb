/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects to login page when
 * any 403 error is returned in any of the network
 * requests
 */

var LOGIN_ROUTE = '/login';

module.exports = function (xhr, textStatus, errorThrown) {
  if (xhr.status === 403) {
    window.location = LOGIN_ROUTE;
  }
};
