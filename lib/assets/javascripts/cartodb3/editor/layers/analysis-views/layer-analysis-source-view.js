var template = require('./layer-analysis-source-view.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;
  },

  render: function () {
    this.$el.html(template(this.model.pick('id', 'table_name')));
    return this;
  }
});
