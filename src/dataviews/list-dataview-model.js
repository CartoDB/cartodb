var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('./dataview-model-base');

module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      type: 'list',
      columns: []
    },
    DataviewModelBase.prototype.defaults
  ),

  initialize: function (attrs, opts) {
    DataviewModelBase.prototype.initialize.call(this, attrs, opts);
    this._data = new Backbone.Collection(this.get('data'));
    this.on('change:columns', this._reloadMapAndForceFetch, this);
  },

  getData: function () {
    return this._data;
  },

  getSize: function () {
    return this._data.size();
  },

  parse: function (data) {
    var rows = data.rows;
    this._data.reset(rows);
    return {
      data: rows
    };
  },

  toJSON: function () {
    return {
      type: 'list',
      source: { id: this._getSourceId() },
      options: {
        columns: this.get('columns')
      }
    };
  }
},

  // Class props
  {
    ATTRS_NAMES: DataviewModelBase.ATTRS_NAMES.concat([
      'columns'
    ])
  }
);
