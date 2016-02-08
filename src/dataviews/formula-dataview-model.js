var _ = require('underscore');
var DataviewModelBase = require('./dataview-model-base');

module.exports = DataviewModelBase.extend({
  defaults: _.extend(
    {
      data: '',
      suffix: '',
      prefix: ''
    },
    DataviewModelBase.prototype.defaults
  ),

  initialize: function () {
    DataviewModelBase.prototype.initialize.apply(this, arguments);
    this.on('change:column change:operation', this._reloadMap, this);
  },

  parse: function (r) {
    return {
      data: r.result,
      nulls: r.nulls
    };
  },

  toJSON: function () {
    return {
      type: 'formula',
      options: {
        column: this.get('column'),
        operation: this.get('operation'),
        suffix: this.get('suffix'),
        prefix: this.get('prefix')
      }
    };
  }

});
