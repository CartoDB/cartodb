var Model = cdb.core.Model;

module.exports = Model.extend({

  isEmpty: function() {
    throw "Filters must implement the .isEmpty method";
  },

  toJSON: function() {
    throw "Filters must implement the .toJSON method";
  }
});
