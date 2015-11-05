var WidgetView = require('../../widget');
var WidgetFormulaContent = require('./content_view');

/**
 * Formula widget view
 */
module.exports = WidgetView.extend({

  _createContentView: function() {
    return new WidgetFormulaContent({
      model: this.model
    });
  }

});
