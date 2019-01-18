
/**
 * Represents a URL.
 * Provides common semantics to manipulate a URL without having to resort to manipulating strings manually.
 * Rather don't subclass but you composition if you need to extend some functionality.
 *
 * Can safely be coerced into a string implicitly, e.g.:
 *   var myUrl = cdb.common.Url.byBasePath('http://foobar.com/some/path')
 *   alert(myUrl); // will output 'http://foobar.com/some/path'
 */
cdb.common.Url = cdb.core.Model.extend({

  initialize: function (attrs) {
    if (!attrs.base_url) {
      throw new Error('base_url is required')
    }
  },

  /**
   * Get a new URL object with new basepath.
   * @param {String,*} path new sub path. Slashes are not necessary, e.g. 'my_path'
   * @return {Object} instance of cdb.common.Url
   */
  urlToPath: function() {
    return cdb.common.Url.byBaseUrl(this.toString.apply(this, arguments));
  },

  /**
   * @return {String} Path of this URL, e.g. '/some/path'
   */
  pathname: function() {
    return this.toString().match(/^.+\/\/[^\/]+(.*)$/)[1];
  },

  toString: function() {
    return this._joinArgumentsWithSlashes(
      this.get('base_url'),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  _joinArgumentsWithSlashes: function() {
    return _.chain(arguments).flatten().compact().value().join('/');
  }

}, {

  byBaseUrl: function(url) {
    return new cdb.common.Url({ base_url: url });
  }
});
