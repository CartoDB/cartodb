/**
  * Gets the value at path of object. If the resolved value is undefined, the defaultValue is returned in its place.
  * @param {Object} object The object to query.
  * @param {String} path The path of the property to get.
  * @param {Any} defaultValue The value returned for undefined resolved values.
  * @return {Any} Returns the resolved value.
  */
module.exports = function (object, path, defaultValue) {
  var keys = path.split('.');
  var value = keys.reduce(function (a, b) {
    return (a || {})[b];
  }, object);

  return value || defaultValue;
};
