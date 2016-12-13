var CoreView = require('backbone/core-view');
var template = require('./tab-pane-file.tpl');

/**
 *  File component
 */

module.exports = CoreView.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) {
      throw new Error('A model should be provided');
    }

    this.model.bind('change:label', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      url: this.model.get('label')
    }));

    var extra = this.model.get('extra');
    var color = extra && extra.color ? extra.color : '';

    this.$('.js-label').css({ fill: color });

    return this;
  }
});
