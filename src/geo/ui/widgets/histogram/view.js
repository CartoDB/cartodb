var Model = require('cdb/core/model');
var WidgetView = require('../../widget');
var WidgetHistogramContent = require('./content_view');

/**
 * Histogram widget view
 */
module.exports = WidgetView.extend({

  _createContentView: function() {
    return new WidgetHistogramContent({
      dataModel: this.model,
      viewModel: new Model(),
      filter: this.filter
    });
  }

});
