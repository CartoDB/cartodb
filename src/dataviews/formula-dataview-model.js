var _ = require('underscore');
var DataviewModelBase = require('./dataview-model-base');

module.exports = DataviewModelBase.extend({
  defaults: _.extend(
    {},
    DataviewModelBase.prototype.defaults,
    {
      data: '',
      suffix: '',
      prefix: ''
    }
  ),

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
