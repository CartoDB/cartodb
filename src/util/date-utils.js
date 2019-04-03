var dateUtils = {};

dateUtils.getLocalOffset = function () {
  var date = new Date();
  // Return local timezone offset in seconds
  return date.getTimezoneOffset() * (-60);
};

module.exports = dateUtils;
