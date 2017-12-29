var URI = require('urijs');
var _ = require('underscore');

module.exports = {
  getURLFromState: function (state) {
    var thisURL = new URI(this.getLocalURL());
    thisURL.removeQuery('state');
    if (!_.isEmpty(state)) {
      var statesString = JSON.stringify(state);
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
    var state;
    var result = {};
    if (uri.hasQuery('state')) {
      state = uri.query(true)['state'];
      if (!_.isEmpty(state)) {
        result = JSON.parse(decodeURIComponent(state));
      }
    }
    return result;
  },
  getLocalURL: _.constant(window.location.href)
};
