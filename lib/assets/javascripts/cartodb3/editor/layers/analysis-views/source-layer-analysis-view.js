var template = require('./source-layer-analysis-view.tpl');
var _ = require('underscore');
var LayerAnalysisHelper = require('../layer-analysis-helper');
require('jquery-ui');
var DRAGGABLE_SCOPE = 'analysis';
var REVERT_DURATION = 100;

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    _.bindAll(this, '_createHelper', '_onDraggableStop');

    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisHelper = new LayerAnalysisHelper(this._layerDefinitionModel);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      tableName: this._layerDefinitionModel.layerTableModel.get('table_name')
    }));

    this._setupDraggable();

    return this;
  },

  _createHelper: function () {
    return this._layerAnalysisHelper.createHelper(this.model);
  },

  _setupDraggable: function () {
    this.$el.draggable({
      revert: true,
      scope: DRAGGABLE_SCOPE,
      revertDuration: REVERT_DURATION,
      stop: this._onDraggableStop,
      helper: this._createHelper
    });
  },

  _onDraggableStop: function (e, ui) {
    if (ui.helper.data('dropped')) {
      console.log(this.model.toJSON());
    }
  }

});
