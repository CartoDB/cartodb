// Make common analyses actions available whin editor context
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var AddAnalysisView = require('../../../../components/modals/add-analysis/add-analysis-view');
var nodeIds = require('../../../../value-objects/analysis-node-ids');

var REQUIRED_OPTS = [
  'onboardings',
  'layerDefinitionsCollection',
  'modals',
  'userModel',
  'configModel'
];

module.exports = (function () {
  return {
    init: function (opts) {
      checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    },

    setLayerId: function (layerId) {
      var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
      if (!layerDefinitionModel) {
        throw new Error('no layer-definition found for id' + layerId + ', available layer ids are: ' + this._layerDefinitionsCollection.pluck('id') + ')');
      }

      this._layerId = layerId;
    },

    setStackLayoutView: function (stackLayoutView) {
      if (!stackLayoutView) {
        throw new Error('stackLayoutView is required');
      }

      this._stackLayoutView = stackLayoutView;
    },

    addGeoreferenceAnalysis: function () {
      var layerDefinitionModel = this._layerDefinitionsCollection.get(this._layerId);

      var letter = layerDefinitionModel.get('letter');
      var sourceId = layerDefinitionModel.get('source');

      this._stackLayoutView.model.goToStep(1, layerDefinitionModel, 'layer-content', 'analyses', {
        source: sourceId,
        id: letter === nodeIds.letter(sourceId)
          ? nodeIds.next(sourceId)
          : letter + '1',
        type: 'georeference-long-lat'
      });
    },

    addAnalysis: function () {
      this._onboardings.destroy();

      var layerDefinitionModel = this._layerDefinitionsCollection.get(this._layerId);

      this._modals.create(function (modalModel) {
        return new AddAnalysisView({
          userModel: this._userModel,
          configModel: this._configModel,
          modalModel: modalModel,
          layerDefinitionModel: layerDefinitionModel
        });
      }.bind(this), {
        breadcrumbsEnabled: true
      });

      this._modals.onDestroyOnce(function (analysisFormAttrs) {
        if (analysisFormAttrs) {
          // A analysis option was seleted, redirect to layer-content view with new attrs
          this._stackLayoutView.model.goToStep(1, layerDefinitionModel, 'layer-content', 'analyses', analysisFormAttrs);
        }
      }, this);
    }
  };
})();
