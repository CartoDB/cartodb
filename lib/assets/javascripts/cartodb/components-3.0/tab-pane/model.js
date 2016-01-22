var cdb = require('cartodb.js');
var TabPaneItem = require('./item/view.js');

module.exports = cdb.core.Model.extend({
  defaults: {
    icon: false,
    selected: false,
    createButtonView: function() { return new cdb.core.View(); },
    createContentView: function() { return new cdb.core.View(); }
  },

  initialize: function() {
  }
});
