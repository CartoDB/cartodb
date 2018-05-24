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
      window.location.href = getRedirectURL(username);
    }
  };
};

function getRedirectURL (username) {
  // We cannot get accountHost and username from configModel
  // and userModel because of static pages. God save static pages.
  var user = username || getUsernameFromURL(window.location.href);

  if (!user) {
    return '';
  }

  var newURL = window.location.origin.replace(subdomainMatch, function () {
    return user;
  });

  return window.location.protocol + '//' + newURL + LOGIN_ROUTE;
}

function getUsernameFromURL (url) {
  var usernameMatches = window.location.pathname.split('/');

  if (usernameMatches.length > 2) {
    return usernameMatches[2];
  }

  var subdomainMatches = url.match(subdomainMatch);

  if (subdomainMatches) {
    return subdomainMatches[1];
  }

  return '';
}
