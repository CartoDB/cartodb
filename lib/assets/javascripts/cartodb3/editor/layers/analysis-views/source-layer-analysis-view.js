var template = require('./source-layer-analysis-view.tpl');
var _ = require('underscore');
var LayerAnalysisHelper = require('../layer-analysis-view-helper');

require('jquery-ui/draggable');

var DRAGGABLE_SCOPE = 'analysis';
var REVERT_DURATION = 100;

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base js-analysis',

  initialize: function (opts) {
    _.bindAll(this, '_createHelper', '_onDraggableStop');

    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      tableName: this._layerDefinitionModel.layerTableModel.get('table_name')
    }));

    this._initDraggable();

    return this;
  },

  _initDraggable: function () {
    this.$el.draggable({
      revert: true,
      scope: DRAGGABLE_SCOPE,
      revertDuration: REVERT_DURATION,
      stop: this._onDraggableStop,
      helper: this._createHelper
    });
  },

  _createHelper: function () {
    this._layerAnalysisHelper = new LayerAnalysisHelper();
    return this._layerAnalysisHelper.createHelper(this);
  },

  _createHelper: function () {
    this._layerAnalysisHelper = new LayerAnalysisHelper();
    return this._layerAnalysisHelper.createHelper(this);
  },

  _onDraggableStop: function (e, ui) {
    if (ui.helper.data('dropped')) {
      console.log(this.model.toJSON());
    }
  },

  _destroyDraggable: function () {
    if (this.$el.data('ui-draggable')) {
      this.$el.draggable('destroy');
    }
  },

  clean: function () {
    this._destroyDraggable();
    cdb.core.View.prototype.clean.apply(this);
  }

});
