var CoreView = require('backbone/core-view');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'label'
];

module.exports = CoreView.extend({
  tagName: 'li',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._label);
    return this;
  }
});
