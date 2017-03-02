var _ = require('underscore');
var Backbone = require('backbone');
var AnalysesService = require('../../../editor/layers/layer-content-views/analyses/analyses-service');
var GeoreferenceOnboardingView = require('./georeference-view');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var GEOREFERENCE_KEY = 'georeference';

var REQUIRED_OPTS = [
  'onboardings',
  'onboardingNotification',
  'layerDefinitionsCollection'
];

module.exports = (function () {
  return {
    init: function (opts) {
      checkAndBuildOpts(opts, REQUIRED_OPTS, this);

      this._omitLayers = [];
    },

    setLayerId: function (layerId) {
      var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);

      if (!layerDefinitionModel) {
        throw new Error('no layer-definition found for id' + layerId + ', available layer ids are: ' + this._layerDefinitionsCollection.pluck('id') + ')');
      }

      this._layerId = layerId;
    },

    findNonGeoreferencedLayer: function () {
      var reverseFiltered = new Backbone.Collection(this._layerDefinitionsCollection.reject(function (layerDefModel) {
        var analysisDefinitionNodeModel = layerDefModel.getAnalysisDefinitionNodeModel();

        return analysisDefinitionNodeModel === void 0 || _(this._omitLayers).contains(layerDefModel.get('id'));
      }, this).reverse());

      reverseFiltered.each(function (layerDefModel) {
        if (!this._layerId) {
          var analysisDefinitionNodeModel = layerDefModel.getAnalysisDefinitionNodeModel();

          var queryGeometryModel = analysisDefinitionNodeModel.queryGeometryModel;
          var querySchemaModel = analysisDefinitionNodeModel.querySchemaModel;
          var queryRowsCollection = analysisDefinitionNodeModel.queryRowsCollection;

          if (queryGeometryModel.shouldFetch()) {
            queryGeometryModel.fetch({
              success: this.findNonGeoreferencedLayer.bind(this)
            });
          }

          if (querySchemaModel.shouldFetch()) {
            querySchemaModel.fetch({
              success: _.debounce(this.findNonGeoreferencedLayer.bind(this), 100)
            });
          }

          if (queryRowsCollection.shouldFetch()) {
            queryRowsCollection.fetch({
              success: this.findNonGeoreferencedLayer.bind(this)
            });
          }

          if (queryGeometryModel.isFetched() && querySchemaModel.isFetched() && queryRowsCollection.isFetched()) {
            if (!queryGeometryModel.hasValue()) {
              var layerId = layerDefModel.get('id');

              if (!layerDefModel.hasAnalyses() &&
                  !layerDefModel.isCustomQueryApplied() &&
                  !queryRowsCollection.isEmpty()) {
                this.setLayerId(layerId);

                this.launch();
              } else {
                this._omitLayers.push(layerId);
                this.findNonGeoreferencedLayer();
              }
            }
          }
        }
      }, this);
    },

    launch: function () {
      if (!this._onboardingNotification.getKey(GEOREFERENCE_KEY)) {
        var layerDefinitionModel = this._layerDefinitionsCollection.get(this._layerId);

        AnalysesService.setLayerId(this._layerId);

        this._onboardings.create(function () {
          return new GeoreferenceOnboardingView({
            onboardingNotification: this._onboardingNotification,
            name: layerDefinitionModel.getName(),
            notificationKey: GEOREFERENCE_KEY
          });
        }.bind(this));
      }
    }
  };
})();
