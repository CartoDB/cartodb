var CoreView = require('backbone/core-view');
var template = require('./static-asset-item-view.tpl');

module.exports = CoreView.extend({
  tagName: 'li',

  initialize: function (opts) {
  },

  render: function () {
    this.clearSubViews();
    this.$el.append(template({
      name: this.model.get('name'),
      public_url: this.model.get('public_url')
    }));
    return this;
  }
});
