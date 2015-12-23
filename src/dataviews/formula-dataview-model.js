var _ = require('underscore');
var DataviewModel = require('./dataview-model');

module.exports = DataviewModel.extend({
  defaults: _.extend(
    {},
    DataviewModel.prototype.defaults,
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
    };
  },

  toJSON: function (d) {
    return {
      type: 'formula',
      options: {
        column: this.get('column'),
        operation: this.get('operation')
      }
    };
  }

});
