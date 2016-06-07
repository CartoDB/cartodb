var _ = require('underscore');
var keys = {};

module.exports = {
  add: function (key, value) {
    if (_.has(keys, key)) throw new Error('key ' + key + ' is already taken');
    keys[key] = value;
  },

  get: function (key) {
    return keys[key];
  }
};
