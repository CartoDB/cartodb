var WidgetView = require('../../widget');
var WidgetListContentView = require('./content_view');

/**
 * List widget view
 */
module.exports = WidgetView.extend({

  _createContentView: function() {
    return new WidgetListContentView({
      model: this.model
    });
  }

});
