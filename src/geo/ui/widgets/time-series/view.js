var WidgetView = require('../../widget');
var ContentView = require('./content-view');

module.exports = WidgetView.extend({

  className: 'Dashboard-time Widget Widget--light Widget--time',

  _createContentView: function() {
    return new ContentView({
      model: this.model,
      filter: this.filter
    });
  }

});
