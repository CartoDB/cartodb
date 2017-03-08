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

    setNonGeoreferencedLayerId: function () {
      var onFindNonGeoreferencedLayer = function (layerDefinitionModel) {
        this._layerId = layerDefinitionModel.get('id');
        this.launch();
      }.bind(this);

      this._layerDefinitionsCollection.findNonGeoreferencedLayer(onFindNonGeoreferencedLayer);
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
