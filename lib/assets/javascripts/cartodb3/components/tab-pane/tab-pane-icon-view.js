var cdb = require('cartodb-deep-insights.js');

/**
 *  Icon component
 */

module.exports = cdb.core.View.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) {
      throw new Error('A model should be provided');
    }
  },

  render: function () {
    this.$el.addClass('CDB-IconFont-' + this.model.get('icon'));
    return this;
  }
});
