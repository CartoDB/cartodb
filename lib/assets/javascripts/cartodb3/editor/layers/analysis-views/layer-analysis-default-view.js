var template = require('./layer-analysis-default-view.tpl');

/**
 * View for an analysis node with a single input
 */
module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.get('id'),
      title: this.model.get('type')
    }));

    return this;
  }
});
