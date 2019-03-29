const _ = require('underscore');
const Backbone = require('backbone');

/**
 * Represents a URL.
 * Provides common semantics to manipulate a URL without having to resort to manipulating strings manually.
 * Rather don't subclass but you composition if you need to extend some functionality.
 *
 * Can safely be coerced into a string implicitly, e.g.:
 *   const myUrl = UrlModel.byBasePath('http://foobar.com/some/path')
 *   alert(myUrl); // will output 'http://foobar.com/some/path'
 */

const UrlModel = Backbone.Model.extend({
  initialize: function (attrs) {
    if (!attrs.base_url) {
      throw new Error('base_url is required');
    }
  },

  /**
   * Get a new URL object with new basepath.
   * @param {String,*} path new sub path. Slashes are not necessary, e.g. 'my_path'
   * @return {Object} instance of cdb.common.Url
   */
  urlToPath: function () {
    return UrlModel.byBaseUrl(this.toString.apply(this, arguments));
  },

  /**
   * @return {String} Path of this URL, e.g. '/some/path'
   */
  pathname: function () {
    return this.toString().match(/^.+\/\/[^\/]+(.*)$/)[1];
  },

  toString: function () {
    return this._joinArgumentsWithSlashes(
      this.get('base_url'),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  _joinArgumentsWithSlashes: function () {
    return _.chain(arguments).flatten().compact().value().join('/');
  }
}, {
  byBaseUrl: function (url) {
    return new UrlModel({ base_url: url });
  }
});

module.exports = UrlModel;
