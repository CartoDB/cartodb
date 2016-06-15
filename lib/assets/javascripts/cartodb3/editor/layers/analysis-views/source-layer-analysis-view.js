var CoreView = require('backbone/core-view');
var template = require('./source-layer-analysis-view.tpl');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base',

  options: {
    showId: true
  },

  render: function () {
    this.$el.html(template({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name')
    }));

    return this;
  }

});
