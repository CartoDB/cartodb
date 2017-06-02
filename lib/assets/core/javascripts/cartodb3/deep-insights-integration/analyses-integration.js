var _ = require('underscore');
var checkAndBuildOpts = require('../helpers/required-opts');
var AnalysisOnboardingLauncher = require('../components/onboardings/analysis/analysis-launcher');
var AnalysisNotifications = require('../editor/layers/analysis-views/analysis-notifications');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'analysisDefinitionsCollection',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'onboardings',
  'userModel'
];

/**
 *  Only manage **ANALYSIS NODES** and **ANALYSIS DEFINITION** actions between
 *  Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._analysisDefinitionNodesCollection.on('add', this._analyseDefinitionNode, this);
    this._analysisDefinitionNodesCollection.on('change', this._analyseDefinitionNode, this);
    this._analysisDefinitionNodesCollection.on('change:id', this._onAnalysisDefinitionNodeIdChanged, this);
    this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);

    this._analysisDefinitionsCollection.on('add change:node_id sync', this._analyseDefinition, this);
    this._analysisDefinitionsCollection.each(this._analyseDefinition, this);
  },

  _analyseDefinition: function (m) {
    var id = m.get('node_id');
    var nodeDefModel = this._analysisDefinitionNodesCollection.get(id);
    this._analyseDefinitionNode(nodeDefModel);
  },

  _onAnalysisDefinitionNodeIdChanged: function (m, changedAttributes) {
    if (this._hasUpdateOnlyNodeAnalysisId(m)) {
      var node = this._diDashboardHelpers.getAnalysis(m.previous('id'));
      node && node.set('id', m.id);
    }
  },

  _onAnalysisDefinitionNodeRemoved: function (m) {
    m.queryRowsCollection.off('remove', this._diDashboardHelpers.invalidateMap(), this);

    var node = this._diDashboardHelpers.getAnalysis(m.previous('id'));
    if (node) {
      node.set({avoidNotification: (m && !!m.get('avoidNotification'))}, {silent: true});
      node.remove();
    }
  },

  _analyseDefinitionNode: function (m) {
    if (!this._hasUpdateOnlyNodeAnalysisId(m)) {
      var attrs = m.toJSON({ skipOptions: true });
      this._diDashboardHelpers.getAnalysis().analyse(attrs);

      // Unfortunately have to try to setup sync until this point, since a node doesn't exist until after analyse call
      this._analysisDefinitionNodesCollection.each(this._tryToSetupDefinitionNodeSync, this);
    }
  },

  _hasUpdateOnlyNodeAnalysisId: function (nodeDefModel) {
    return nodeDefModel.hasChanged('id') && _.size(nodeDefModel.changed) === 1;
  },

  _tryToSetupDefinitionNodeSync: function (m) {
    if (m.__syncSetup) return; // only setup once

    var node = this._analysis().findNodeById(m.id);
    var layerDefModel = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(m);
    if (!node) return; // might not exist when method is called, so do nothing to allow retries

    m.__syncSetup = true;
    m.__initialization = true;

    // Don't need to sync source nodes
    if (node.get('type') !== 'source') {
      AnalysisNotifications.track(node, layerDefModel);

      var updateAnalysisQuerySchema = function () {
        var query = node.get('query');
        var status = node.get('status');
        var error = node.get('error');

        m.querySchemaModel.set({
          status: 'unfetched',
          query: query,
          ready: status === 'ready'
        });
        m.queryGeometryModel.set({
          status: 'unfetched',
          query: query,
          ready: status === 'ready'
        });

        m.set({
          status: status,
          error: error
        });

        if (status === 'ready') {
          if (!m.__initialization) {
            m.trigger('queryObjectsUpdated', m);
          }

          m.__initialization = false;
        }
      };

      AnalysisOnboardingLauncher.init({
        onboardings: this._onboardings,
        userModel: this._userModel
      });

      m.listenTo(node, 'change:status', function (model, status) {
        if (status === 'ready' && m.USER_SAVED) {
          AnalysisOnboardingLauncher.launch(node.get('type'), model);
          m.USER_SAVED = false;
        }
      });

      updateAnalysisQuerySchema();

      m.listenTo(node, 'change:query change:status change:error', updateAnalysisQuerySchema);
      m.listenToOnce(node, 'destroy', m.stopListening);
    } else {
      m.listenTo(m.querySchemaModel, 'resetDueToAlteredData', this._diDashboardHelpers.invalidateMap.bind(this));
    }
  }

};
