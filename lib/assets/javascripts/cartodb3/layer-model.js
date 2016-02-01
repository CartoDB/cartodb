var cdb = require('cartodb.js');
var EdWidgetsCollection = require('./editor-widgets-collection');

module.exports = cdb.core.Model.extend({

  initialize: function () {
    this.widgets = new EdWidgetsCollection();
    this.widgets.url = function () {
      return this.url() + '/widgets';
    }.bind(this);
  }
});
