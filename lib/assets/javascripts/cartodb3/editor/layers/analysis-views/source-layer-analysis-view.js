var CoreView = require('backbone/core-view');
var template = require('./source-layer-analysis-view.tpl');
var SQLUtils = require('../../../helpers/sql-utils');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  options: {
    showId: true
  },

  render: function () {
    var tableName = this.model.get('table_name');
    var originalQuery = 'SELECT * FROM ' + tableName;
    var ownerName = this._layerDefinitionModel.get('user_name');
    var qualifiedQuery = 'SELECT * FROM ' + ownerName + '.' + tableName;
    var query = this.model.get('query');

    // As we don't know if the user is in an org or not, we check both versions of the query
    var isCustomQueryApplied = !SQLUtils.isSameQuery(originalQuery, query) && !SQLUtils.isSameQuery(qualifiedQuery, query);
    this.$el.html(template({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name'),
      customQueryApplied: isCustomQueryApplied
    }));

    return this;
  }

});
