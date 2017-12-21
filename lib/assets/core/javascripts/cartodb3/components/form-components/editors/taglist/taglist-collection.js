var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  removeTag: function (label) {
    var m = this.findWhere({label: label});
    m && this.remove(m);
  },

  addTag: function (label) {
    var m = this.findWhere({label: label});
    !m && this.add({label: label});
  },

  getValue: function () {
    return this.map(function (mdl) {
      return mdl.get('label');
    });
  }
});
