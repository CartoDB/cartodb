var cdb = require('internal-carto.js');

/**
 *  Icon component
 */

module.exports = cdb.core.View.extend({

  initialize: function (options) {
    if (!this.model) throw new Error('A model should be provided');
    if (!options.template) throw new Error('A template should be provided');
    this.template = options.template;
  },

  render: function () {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }
});
