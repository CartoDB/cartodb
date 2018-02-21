var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var analyses = require('builder/data/analyses');
var template = require('./ref-layer-analysis-view.tpl');

/**
 * View for an analysis node that belongs to another layer
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis-node',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this._stateModel = new Backbone.Model({
      highlighted: false
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._analysisNode, 'change:status', this.render);
    this.add_related_model(this._analysisNode);

    this.listenTo(this._layerDefinitionModel, 'change', this.render);
    this.add_related_model(this._layerDefinitionModel);

    this.listenTo(this._stateModel, 'change:highlighted', this._toggleHover);
    this.add_related_model(this._stateModel);
  },

  render: function () {
    var status = this._analysisNode.get('status');

    this.$el.html(template({
      id: this.model.id,
      layerName: this._layerDefinitionModel.getName(),
      bgColor: this.model.getColor(),
      isDone: status === 'ready' || status === 'failed',
      title: analyses.title(this.model)
    }));
    this.$el.toggleClass('has-error', status === 'failed');

    this.el.dataset.analysisNodeId = this.model.id;

    return this;
  },

  _onMouseEnter: function () {
    this._stateModel.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this._stateModel.set('highlighted', false);
  },

  _toggleHover: function () {
    var $layer = this.$el.closest('.js-layer');
    var $title = $layer.find('.js-Editor-ListLayer-titleText');
    var highlighted = this._stateModel.get('highlighted');

    $layer.toggleClass('is-hover', highlighted);
    $title.toggleClass('is-hover', highlighted);
  }
});
