var StyleUtils = require('./style-generation-utils');

/**
 *  Function for generating the animation CartoCSS properties
 *
 */

module.exports = function (animationdObj) {
  var css = {};

  if (StyleUtils.isStyleAttributeValid(animationdObj.attribute)) {
    css['-torque-frame-count'] = animationdObj.steps;
    css['-torque-animation-duration'] = animationdObj.duration;
    css['-torque-time-attribute'] = '"' + animationdObj.attribute + '"';
    if (animationdObj.isCategory) {
      css['-torque-aggregation-function'] = '"CDB_Math_Mode(value)"';
    } else {
      css['-torque-aggregation-function'] = '"count(1)"';
    }
    css['-torque-resolution'] = animationdObj.resolution;
    css['-torque-data-aggregation'] = animationdObj.overlap ? 'cumulative' : 'linear';
  }
  return css;
};
