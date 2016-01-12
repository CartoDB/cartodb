var Model = require('../../core/model');

module.exports = Model.extend({
  initialize: function (bounds) {
    this.setBounds(bounds);
  },

  setBounds: function (bounds) {
    this.set({
      west: bounds[0][1],
      south: bounds[0][0],
      east: bounds[1][1],
      north: bounds[1][0]
    });
  },

  toString: function () {
    return [
      this.get('west'),
      this.get('south'),
      this.get('east'),
      this.get('north')
    ].join(',');
  }
});
