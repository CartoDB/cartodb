var instances = {};

// Creates a proxy object, to allow setting a required object at runtime.
//
// @example how to use
//   module.exports = require('./create-require-proxy')('backbone');
//
// @param {String} name the return proxy is supposed to represent
// @return {Object} with set/get methods of the instance the proxy represent.
var createProxy = function(name) {
  var errorPrefix = name + '-proxy: ';

  return {

    // @param {Object} val
    // @return {this}
    set: function(val) {
      if (!val) throw new Error(errorPrefix + 'val is required');
      instances[name] = val;
      return this;
    },

    // @return {Object}
    get: function() {
      var val = instances[name];
      if (!val) throw new Error(errorPrefix + 'must have called .set() before can .get() it');
      return val;
    },

    // for testing purposes
    __unset: function() {
      instances[name] = null;
      delete instances[name];
    }
  }
};

// for testing purposes
createProxy.__reset = function() {
  instances = {};
};

module.exports = createProxy;
