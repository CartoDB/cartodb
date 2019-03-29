const Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  fetched: false,

  initialize: function () {
    this.bind('sync', () => {
      this.fetched = true;
    });
  },

  /**
   * get value for row index and columnName
   */
  getCell: function (index, columnName) {
    var r = this.at(index);
    if (!r) {
      return null;
    }
    return r.get(columnName);
  },

  isEmpty: function () {
    return this.length === 0;
  }

});
