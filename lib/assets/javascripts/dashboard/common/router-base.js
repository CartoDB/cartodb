var _ = require('underscore');
var Backbone = require('backbone');

/**
 * @extends http://backbonejs.org/#Router With some common functionality in the context of this app.
 */
var RouterBase = Backbone.Router.extend({

  /**
   * Placeholder, is replaced by enableAfterMainView().
   */
  navigate: function () {
    throw new Error('router.enableAfterMainView({ ... }) must be called before you can navigate');
  },

  /**
   * Enable router to monitor and manage browser URL and history.
   * Expected to be called after main view as the function name indicates,
   */
  enableAfterMainView: function () {
    /**
     * @override http://backbonejs.org/#Router-navigate Allow
     * @param fragmentOrUrl {String} Either a fragment (e.g. '/dashboard/datasets') or a full URL
     *  (e.g. http://user.carto.com/dashboard/datasets), the navigate method takes care to route correctly.
     */
    this.navigate = function (fragmentOrUrl, opts) {
      Backbone.Router.prototype.navigate.call(this, this.normalizeFragmentOrUrl(fragmentOrUrl), opts);
    };

    Backbone.history.start({
      pushState: true,
      root: this.rootPath() + '/' // Yes, this trailing slash is necessary for the router to update the history state properly.
    });
  },

  rootPath: function () {
    throw new Error('implement rootPath in child router (no trailing slash)');
  },

  /**
   * Normalise a given fragment or URL for navigation mechanisms to work.
   * Typically, remove the leading base URL from the given fragment or URL.
   *
   * @param {String} fragmentOrUrl
   * @return {String}
   */
  normalizeFragmentOrUrl: function (fragmentOrUrl) {
    throw new Error('implement normalizeFragmentOrUrl in child router');
  }
});

RouterBase.supportTrailingSlashes = function (obj) {
  return _.reduce(obj, function (res, val, key) {
    res[key] = val;
    res[key + '/'] = val;
    return res;
  }, {});
};

module.exports = RouterBase;
