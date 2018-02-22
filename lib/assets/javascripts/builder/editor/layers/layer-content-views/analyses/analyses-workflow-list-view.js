var CoreView = require('backbone/core-view');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow-list.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var utils = require('builder/helpers/utils');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'analysisFormsCollection',
  'layerId',
  'selectedNodeId'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      layerId: this._layerId
    }));

    this._initViews();

    return this;
  },

  _initViews: function () {
    this._analysisFormsCollection.each(this._renderWorkflowItem, this);
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-add-analysis'),
      gravity: 'w',
      title: function () {
        return utils.replaceLastSpaceWithNbsp(_t('editor.layers.analysis-form.add-analysis.tooltip'));
      },
      offset: 8
    });
    this.addView(tooltip);
  },

  _renderWorkflowItem: function (formModel) {
    var view = new AnalysesWorkflowItemView({
      analysisNode: this._analysisDefinitionNodesCollection.get(formModel.id),
      formModel: formModel,
      layerId: this._layerId,
      selectedNodeId: this._selectedNodeId
    });
    this.$('.js-analyes').append(view.render().el);
    this.addView(view);
  }
});
