const CoreView = require('backbone/core-view');
const template = require('./placeholder-item-template.tpl');
/**
 * Represents a map card on data library.
 */

module.exports = CoreView.extend({

  className: 'MapsList-item MapsList-item--fake',

  tagName: 'li',

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    return this;
  }
});
