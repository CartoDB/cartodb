var template = require('./ref-layer-analysis-view.tpl');
var _ = require('underscore');
var LayerAnalysisHelper = require('../layer-analysis-view-helper');

require('jquery-ui');

var DRAGGABLE_SCOPE = 'analysis';
var REVERT_DURATION = 100;

/**
 * Reference to another layer.
 * this.model is a layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    _.bindAll(this, '_createHelper', '_onDraggableStop');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      letter: this.model.get('letter'),
      title: this.model.getName()
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
