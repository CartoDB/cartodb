var template = require('./default-layer-analysis-view.tpl');
var _ = require('underscore');
require('jquery-ui');
var LayerAnalysisHelper = require('../layer-analysis-helper');

var DRAGGABLE_SCOPE = 'analysis';
var REVERT_DURATION = 100;

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    _.bindAll(this, '_createHelper', '_onDraggableStop');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisHelper = new LayerAnalysisHelper(this._layerDefinitionModel);

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      title: this.model.get('type')
    }));

    this._setupDraggable();

    return this;
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

  _createHelper: function () {
    return this._layerAnalysisHelper.createHelper(this.model);
  },

  _onDraggableStop: function (e, ui) {
    if (ui.helper.data('dropped')) {
      console.log(this.model.toJSON());
    }
  }
});
