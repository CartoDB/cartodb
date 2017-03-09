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
    },

    setLayerId: function (layerId) {
      var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
      if (!layerDefinitionModel) {
        throw new Error('no layer-definition found for id' + layerId + ', available layer ids are: ' + this._layerDefinitionsCollection.pluck('id') + ')');
      }

      this._layerId = layerId;
    },

    getLayerId: function () {
      return this._layerId;
    },

    setNonGeoreferencedLayerId: function () {
      var onFindNonGeoreferencedLayer = function (layerDefinitionModel) {
        this.setLayerId(layerDefinitionModel.get('id'));
        this.launch();
      }.bind(this);

      this._layerDefinitionsCollection.findNonGeoreferencedLayer(onFindNonGeoreferencedLayer);
    },

    launch: function () {
      if (!this._onboardingNotification.getKey(GEOREFERENCE_KEY)) {
        var layerId = this.getLayerId();
        var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);

        AnalysesService.setLayerId(layerId);

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
