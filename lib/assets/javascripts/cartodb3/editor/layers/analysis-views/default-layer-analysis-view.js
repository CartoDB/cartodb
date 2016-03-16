var template = require('./default-layer-analysis-view.tpl');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      title: this.model.get('type')
    }));

    return this;
  }
});
