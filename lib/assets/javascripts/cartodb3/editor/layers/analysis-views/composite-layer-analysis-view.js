var template = require('./composite-layer-analysis-view.tpl');
var LayerAnalysisHelper = require('../layer-analysis-view-helper');

require('jquery-ui/draggable');

var DRAGGABLE_SCOPE = 'analysis';
var REVERT_DURATION = 100;

/**
 * View for an analysis node which have two source nodes as input.
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    var sourceIds = this.model.sourceIds();

    var view = this._layerAnalysisViewFactory.createView(sourceIds[0], this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);

    view = this._layerAnalysisViewFactory.createView(sourceIds[1], this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);

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
