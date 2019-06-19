function getUserPathname (pathname) {
  var usernameRegex = /^\/\u(?:ser)?\/([a-zA-Z0-9\-]+)/;
  var matchData = usernameRegex.exec(pathname);
  var userPathname = matchData && matchData[0];
  var username = matchData && matchData[1]
    ? matchData[1]
    : '';

  return {
    userPathname: userPathname,
    username: username
  };
}

module.exports = {
  getBaseUrl: function (location) {
    var locationObject = location || window.location;
    var currentURLOrigin = locationObject.origin;
    var urlData = getUserPathname(locationObject.pathname);

    if (urlData.username) {
      return currentURLOrigin + urlData.userPathname;
    }

    return currentURLOrigin;
  },

  needsToChangeBaseURL: function (baseURL, location) {
    return baseURL !== this.getBaseUrl(location);
  }
};
