var _ = require('underscore');
var WidgetModel = require('../widget_model');

module.exports = WidgetModel.extend({

  // TODO: The response format has probably changed
  parse: function(r) {
    return {
      data: r.result,
      nulls: r.nulls
    };
  },

  toJSON: function(d) {
      return {
          type: "formula",
          options: {
              column: this.get('column'),
              operation: this.get('operation')
          }
      };
  }
});
