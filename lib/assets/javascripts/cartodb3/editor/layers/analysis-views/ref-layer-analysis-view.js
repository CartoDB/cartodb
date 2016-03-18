var template = require('./ref-layer-analysis-view.tpl');

/**
 * Reference to another layer.
 * this.model is a layer-definition-model
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      letter: this.model.get('letter'),
      title: this.model.getName()
    }));

    return this;
  }
});
