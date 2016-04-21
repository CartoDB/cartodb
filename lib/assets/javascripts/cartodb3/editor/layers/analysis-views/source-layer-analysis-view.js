var template = require('./source-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = BaseLayerAnalysisView.extend({

  options: {
    showId: true,
    isDraggable: true
  },

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base js-analysis',

  render: function () {
    this.$el.html(template({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name')
    }));

    if (this.options.isDraggable) {
      this._addDraggableHelper();
    }

    return this;
  },

  _onClick: function (e) {
    this.killEvent(e);
  }

});
