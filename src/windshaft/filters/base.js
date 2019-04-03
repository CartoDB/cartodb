var Model = require('../../core/model');

module.exports = Model.extend({

  isEmpty: function () {
    throw new Error('Filters must implement the .isEmpty method');
  },

  toJSON: function () {
    throw new Error('Filters must implement the .toJSON method');
  },

  remove: function () {
    this.trigger('destroy', this);
    this.stopListening();
  }
});
