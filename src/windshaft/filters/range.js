var _ = require('underscore');
var WindshaftFilterBase = require('./base');

module.exports = WindshaftFilterBase.extend({

  isEmpty: function() {
    return _.isUndefined(this.get('min')) && _.isUndefined(this.get('max'));
  },

  setRange: function(range) {
    this.set(range);
  },

  unsetRange: function(range) {
    this.unset('min', { silent: true });
    this.unset('max', { silent: true });
    this.trigger('change', this);
  },


  toJSON: function() {
    var json = {};
    json[this.get('widgetId')] = { min: this.get('min'), max: this.get('max') };

    return json;
  }
});
