var _ = require('underscore');
var DataviewModelBase = require('./dataview-model-base');

module.exports = DataviewModelBase.extend({
  defaults: _.extend(
    {
      type: 'formula',
      data: ''
    },
    DataviewModelBase.prototype.defaults
  ),

  initialize: function () {
    DataviewModelBase.prototype.initialize.apply(this, arguments);
    this.on('change:column change:operation', this._reloadMapAndForceFetch, this);
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
      source: { id: this._getSourceId() },
      options: {
        column: this.get('column'),
        operation: this.get('operation')
      }
    };
  }
},

  // Class props
  {
    ATTRS_NAMES: DataviewModelBase.ATTRS_NAMES.concat([
      'column',
      'operation'
    ])
  }
);
