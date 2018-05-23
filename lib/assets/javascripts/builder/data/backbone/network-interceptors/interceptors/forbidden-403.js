/**
 * 403 Forbidden Network Error Interceptor
 *
 * This interceptor redirects to login page when
 * any 403 session expired error is returned in any of the
 * network requests
 */

var PASSWORD_CHANGE_ROUTE = '/password_change/';
var SESSION_EXPIRED = 'session_expired';

var organizationUsernameMatch = /\/(u|user)\/(.*)\//;
var subdomainMatch = /https?:\/\/([^.]+)/;

module.exports = function (xhr, textStatus, errorThrown) {
  if (xhr.status !== 403) return;

  var error = xhr.responseJSON && xhr.responseJSON.error;

  if (error === SESSION_EXPIRED) {
    window.location.href = getRedirectURL();
  }
};

function getRedirectURL () {
  // We cannot get accountHost and username from configModel
  // and userModel because of static pages. God save static pages.
  var username = getUsernameFromURL(location.href);

  if (!username) {
    return '';
  }

  var newURL = location.origin.replace(subdomainMatch, function () {
    return username;
  });

  return location.protocol + '//' + newURL + PASSWORD_CHANGE_ROUTE + username;
}

function getUsernameFromURL (url) {
  var usernameMatches = url.match(organizationUsernameMatch);

  if (usernameMatches) {
    return usernameMatches[2];
  }

  var subdomainMatches = url.match(subdomainMatch);

  if (subdomainMatches) {
    return subdomainMatches[1];
  }

  return '';
}
