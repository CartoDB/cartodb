var moment = require('moment');
require('moment-timezone');

var dateUtils = {};

dateUtils.getLocalOffset = function () {
  return moment.tz(moment.tz.guess()).utcOffset() * 60;
};

module.exports = dateUtils;
