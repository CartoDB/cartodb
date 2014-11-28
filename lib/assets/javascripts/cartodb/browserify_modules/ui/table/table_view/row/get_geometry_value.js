var _ = require('underscore');

// from row_view.js, should really be extracted to value object, or consolidated to appropriate model.
module.exports = function(table, value) {
  function geomDisplayValue(value) {
    var v = _.uniq(table.geomColumnTypes());
    if (!_.isNull(value) && v && v.length && v[0]) {
      v = v[0];
      // capitalize
      value = v.charAt(0).toUpperCase() + v.substring(1).toLowerCase();
    }
    return value;
  }

  var objValue = {};
  try {
    objValue = JSON.parse(value);
    function formatCoord(c) {
      var val = "       ";
      if (c !== undefined) {
        val = c.toFixed(4);
        if (c > 0) {
          val = " " + val;
        }
      }
      return val;
    }
    if(objValue.type === 'Point') {
      value = formatCoord(objValue.coordinates[0]) + ',' + formatCoord(objValue.coordinates[1]);
    } else {
      value = geomDisplayValue(value);
    }
  } catch (e) {
    value = geomDisplayValue(value);
  }
  return value;
};

