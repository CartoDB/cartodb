var _ = require('underscore');
var WidgetModel = require('../widget_model');

module.exports = WidgetModel.extend({

  // TODO: The response format has probably changed
  parse: function(r) {
    return {
      data: _.reduce(r, function(memo, d) {
        return memo + parseInt(d.trees);
      }, 0)
    };
  }
});
