var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var AnalysisOnboardingLauncher = require('builder/components/onboardings/analysis/analysis-launcher');
var AnalysisNotifications = require('builder/editor/layers/analysis-views/analysis-notifications');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'analysisDefinitionsCollection',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'onboardings',
  'userModel',
  'visDefinitionModel'
];

/**
 *  Only manage **ANALYSIS NODES** and **ANALYSIS DEFINITION** actions between
 *  Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._analysisDefinitionNodesCollection.each(function (analysisDefinitionNode) {
      analysisDefinitionNode.queryRowsCollection.on('remove', this._invalidateMap, this);
    }, this);

    this._analysisDefinitionNodesCollection.on('add', this._onAnalysisDefinitionNodeAdded, this);
    this._analysisDefinitionNodesCollection.on('change', this._onAnalysisDefinitionNodeChanged, this);
    this._analysisDefinitionNodesCollection.on('change:id', this._onAnalysisDefinitionNodeIdChanged, this);
    this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);

    this._analysisDefinitionsCollection.on('add', this._onAnalysisDefinitionAdded, this);
    this._analysisDefinitionsCollection.on('sync', this._onAnalysisDefinitionSync, this);

    this._analysisDefinitionsCollection.each(this._analyseDefinition, this);

    return this;
  },

  _onAnalysisDefinitionNodeAdded: function (node) {
    node.queryRowsCollection.on('remove', this._invalidateMap, this);
    this.analyseDefinitionNode(node);
  },

  _onAnalysisDefinitionNodeChanged: function (node) {
    if (!this._hasUpdatedOnlyNodeAnalysisStatus(node)) {
      // Only call analyse if there is a non-only-status change
      this.analyseDefinitionNode(node);
    }
  },

  _onAnalysisDefinitionNodeIdChanged: function (node) {
    if (this._hasUpdatedOnlyNodeAnalysisId(node)) {
      var analysis = this._diDashboardHelpers.getAnalysisByNodeId(node.previous('id'));
      if (analysis) {
        analysis.set('id', node.id);
      }
    }
  },

  _onAnalysisDefinitionNodeRemoved: function (node) {
    node.queryRowsCollection.off('remove', this._invalidateMap, this);
    var analysis = this._diDashboardHelpers.getAnalysisByNodeId(node.previous('id'));
    if (analysis) {
      analysis.set({avoidNotification: (node && !!node.get('avoidNotification'))}, {silent: true});
      analysis.remove();
    }
  },

  _onAnalysisDefinitionAdded: function (definition) {
    this._analyseDefinition(definition);
  },

  _onAnalysisDefinitionSync: function (definition) {
    this._analyseDefinition(definition);
  },

  _analyseDefinition: function (definition) {
    var id = definition.get('node_id');
    var node = this._analysisDefinitionNodesCollection.get(id);
    this.analyseDefinitionNode(node);
  },

  analyseDefinitionNode: function (node) {
    if (!this._hasUpdatedOnlyNodeAnalysisId(node)) {
      var attrs = node.toJSON({ skipOptions: true });
      this._diDashboardHelpers.analyse(attrs);

      this._tryToSetupDefinitionNodesSync();
    }
  },

  _hasUpdatedOnlyNodeAnalysisStatus: function (node) {
    return node.hasChanged('status') && _.size(node.changed) === 1;
  },

  _hasUpdatedOnlyNodeAnalysisId: function (node) {
    return node.hasChanged('id') && _.size(node.changed) === 1;
  },

  _tryToSetupDefinitionNodesSync: function () {
    // Unfortunately have to try to setup sync until this point, since a node doesn't exist until after analyse call
    this._analysisDefinitionNodesCollection.each(this._tryToSetupDefinitionNodeSync, this);
  },

  _tryToSetupDefinitionNodeSync: function (node) {
    var isCachedAnalysis = this._isCachedAnalysis(node);
    if (node.__syncSetup && !isCachedAnalysis) return; // only setup once

    var analysis = this._diDashboardHelpers.getAnalysisByNodeId(node.id);
    var layerDefinition = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(node);
    if (!analysis) return; // might not exist when method is called, so do nothing to allow retries

    node.__syncSetup = true;
    node.__initialization = true;

    if (isCachedAnalysis) {
      AnalysisOnboardingLauncher.launch(analysis.get('type'), node);
      node.USER_SAVED = false;
      return;
    }

    // Don't need to sync source nodes
    if (analysis.get('type') !== 'source') {
      AnalysisNotifications.track(analysis, layerDefinition);

      var updateAnalysisQuerySchema = function () {
        var query = analysis.get('query');
        var status = analysis.get('status');
        var error = analysis.get('error');

        node.querySchemaModel.set({
          status: 'unfetched',
          query: query,
          ready: status === 'ready'
        });
        node.queryGeometryModel.set({
          status: 'unfetched',
          query: query,
          ready: status === 'ready'
        });

        node.set({
          status: status,
          error: error
        });

        if (status === 'ready') {
          if (!node.__initialization) {
            node.trigger('queryObjectsUpdated', node);
          }

          node.__initialization = false;
        }
      };

      AnalysisOnboardingLauncher.init({
        onboardings: this._onboardings,
        userModel: this._userModel,
        visDefinitionModel: this._visDefinitionModel
      });

      node.listenTo(analysis, 'change:status', function (model, status) {
        if (status === 'ready' && node.USER_SAVED) {
          AnalysisOnboardingLauncher.launch(analysis.get('type'), model);
          node.USER_SAVED = false;
        }
      });

      updateAnalysisQuerySchema();

      node.listenTo(analysis, 'change:query change:status change:error', updateAnalysisQuerySchema);
      node.listenToOnce(analysis, 'destroy', node.stopListening);
    } else {
      node.listenTo(node.querySchemaModel, 'resetDueToAlteredData', this._invalidateMap.bind(this));
    }
  },

  _isCachedAnalysis: function (node) {
    return node.hasChanged('status') && node.get('status') === 'ready' && node.previous('status') === 'launched';
  },

  _invalidateMap: function () {
    this._diDashboardHelpers.invalidateMap();
  }
};
