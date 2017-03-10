var _ = require('underscore');

/**
 * Value object to calcualte distances
 */
module.exports = {
  OPTIONS: [
    {
      distance: 'meters',
      metersPerDistance: 1
    }, {
      distance: 'kilometers',
      metersPerDistance: 1000
    }, {
      distance: 'miles',
      metersPerDistance: 1609.34
    }
  ],

  /**
   * @param {Number} val - e.g. 3
   * @param {String} distance - e.g. 'kilometers'
   * @param {Float} e.g. 3000
   */
  toMeters: function (val, distance) {
    val = parseFloat(val);
    if (isNaN(val)) throw new Error('val (1st arg) is required, expected a parseable number or float');

    var option = _.find(this.OPTIONS, function (d) {
      return d.distance === distance;
    });
    if (!option) throw new Error(distance + ' (2nd arg) is not a valid distance value, expects one of ' + _.pluck(this.OPTIONS, 'distance').join(', '));

    return val * option.metersPerDistance;
  },

  toDistance: function (meters, distance) {
    meters = parseFloat(meters);
    if (isNaN(meters)) throw new Error('meters (1st arg) is required');

    var option = _.find(this.OPTIONS, function (d) {
      return d.distance === distance;
    });
    if (!option) throw new Error(distance + ' (2nd arg) is not a valid distance value, expects one of ' + _.pluck(this.OPTIONS, 'distance').join(', '));

    return meters / option.metersPerDistance;
  }
};
