var _ = require('underscore');
var Model = require('../core/model');
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

  fetch: function (opts) {
    if (this.layer.getDataProvider()) {
      this._fetchFromDataProvider(opts);
    } else {
      return Model.prototype.fetch.call(this, opts);
    }
    this.trigger('loading', this);
  },

  _fetchFromDataProvider: function (opts) {
    var dataProvider = this.layer.getDataProvider();
    dataProvider.bind('featuresChanged', function (features) {
      
      // TODO: This can be extracted from here
      var data = {};
      if (this.get('operation') === 'count') {
        data = {
          'operation': 'count',
          'result': features.length,
          'nulls': 0,
          'type': 'formula'
        };
      } else if (this.get('operation') === 'avg') {
        var column = this.get('column');
        var total = 0;
        _.each(features, function (feature) {
          total += parseInt(feature[column], 16);
        });
        data = {
          'operation': 'avg',
          'result': (total / features.length).toFixed(2),
          'nulls': 0,
          'type': 'formula'
        };
      } else {
        throw new Error('operation not supported');
      }

      this.set(this.parse(data));
      this.trigger('sync');
      opts && opts.success && opts.success(this);
    }, this);
  },

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
