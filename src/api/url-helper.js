var URI = require('urijs');
var _ = require('underscore');

module.exports = {
  getURLFromState: function (state) {
      var thisURL = new URI(this.getLocalURL());
      thisURL.removeQuery('state');
      if (!_.isEmpty(state)) {
        var statesString = encodeURIComponent(JSON.stringify(state));
        thisURL.setQuery('state', statesString);
      }
      return thisURL.toString();
  },
  getStateFromCurrentURL: function () {
    var currentURL = this.getLocalURL();
    return this.getStateFromURL(currentURL);
  },
  getStateFromURL: function (url) {
    var uri = new URI(url);
    if (uri.hasQuery('state')) {
      return JSON.parse(decodeURIComponent(uri.query(true)['state']));
    } 
    return {};
  },
  getLocalURL: _.constant(window.location.href)
};