var _ = require('underscore')
var WidgetModel = require('../widget-model')

module.exports = WidgetModel.extend({
  defaults: _.extend(
    {},
    WidgetModel.prototype.defaults,
    {
      data: '',
      suffix: '',
      prefix: ''
    }
  ),

  // TODO: The response format has probably changed
  parse: function (r) {
    return {
      data: r.result,
      nulls: r.nulls
    }
  },

  toJSON: function (d) {
    return {
      type: 'formula',
      options: {
        column: this.get('column'),
        operation: this.get('operation')
      }
    }
  }

})
