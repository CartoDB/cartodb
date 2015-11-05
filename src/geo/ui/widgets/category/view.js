var WidgetView = require('../../widget');
var WidgetCategoryContent = require('./content_view');

/**
 * Category widget view
 */
module.exports = WidgetView.extend({

  _createContentView: function() {
    return new WidgetCategoryContent({
      model: this.model,
      filter: this.filter
    });
  }

});
