var $ = require('jquery');
var DataLayerView = require('./data-layer-view');
var template = require('./data-layer.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var geometryNoneTemplate = require('./geometry-none.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var defaultLayerAnalysisView = require('builder/editor/layers/analysis-views/default-layer-analysis-view.tpl');
var BROKEN_NODE_LAYER_COLOR = '#CCC';

var REQUIRED_OPTS = [
  'userActions',
  'layerDefinitionsCollection',
  'modals',
  'configModel',
  'stateDefinitionModel',
  'widgetDefinitionsCollection',
  'visDefinitionModel',
  'analysisDefinitionNodesCollection'
];

module.exports = DataLayerView.extend({

  tagName: 'li',
  className: 'Editor-ListLayer-item',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;
    var isTorque = m.isTorqueLayer();
    var isAnimation = this.model.styleModel.isAnimation();

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      color: BROKEN_NODE_LAYER_COLOR,
      isVisible: true,
      isAnimated: isAnimation,
      isTorque: isTorque,
      hasError: false,
      isCollapsed: false,
      numberOfAnalyses: m.getNumberOfAnalyses(),
      numberOfWidgets: this._widgetDefinitionsCollection.widgetsOwnedByLayer(m.id),
      needsGeocoding: false,
      hasGeom: false,
      brokenLayer: true,
      isEmpty: false
    }));

    this.$('.js-thumbnail').append(
      geometryNoneTemplate({
        letter: m.get('letter')
      })
    );

    // Displaying errored node
    var $nodeAnalysisItem = $('<li>').addClass('Editor-ListAnalysis-item Editor-ListAnalysis-layer');
    $nodeAnalysisItem.append(
      defaultLayerAnalysisView({
        title: _t('editor.layers.errors.broken-node'),
        id: this.model.get('source'),
        bgColor: BROKEN_NODE_LAYER_COLOR,
        isDone: true,
        hasError: false
      })
    );
    this.$('.js-analyses').append($nodeAnalysisItem);

    this.$el.addClass('is-errored');
    this.$el.removeClass('js-sortable-item');
    this.$el.toggleClass('is-animated', isTorque);

    var errorTooltip = new TipsyTooltipView({
      el: this.$('.js-warningIcon'),
      gravity: 's',
      offset: 0,
      title: function () {
        return _t('editor.layers.errors.non-existent-node', { nodeId: this.model.get('source') });
      }.bind(this)
    });
    this.addView(errorTooltip);

    return this;
  },

  _getContextMenuOptions: function () {
    return [{
      label: _t('editor.layers.options.delete-and-reload'),
      val: 'delete-layer',
      action: function () {
        this.listenTo(this.model, 'destroy', this._reloadApplication);

        this._confirmDeleteLayer();
      }.bind(this),
      destructive: true
    }];
  },

  _reloadApplication: function () {
    window.location.reload();
  }

});
