var template = require('./source-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = BaseLayerAnalysisView.extend({

  options: {
    showId: true
  },

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base',

  render: function () {
    this.$el.html(template({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name')
    }));

    return this;
  },

  /**
   * @override {BaseLayerAnalysisView._onClick} a source analysis should not be editable
   */
  _onClick: function () {}

});
