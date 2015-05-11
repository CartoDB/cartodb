var pluralizeStr = function(singular, plural, count) {
  if (arguments.length === 2) {
    // Backward compability with prev usages, retrofit to the new params signature
    // pluralizeStr('foobar' , 3) // => foobars
    return pluralizeStr.call(this, arguments[0], arguments[0] + 's', arguments[1]);
  }

  return count === 1 ? singular : plural;
};

module.exports = pluralizeStr;
