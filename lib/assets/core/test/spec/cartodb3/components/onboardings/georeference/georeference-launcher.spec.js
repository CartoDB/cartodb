var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var GeoreferenceOnboardingLauncher = require('../../../../../../javascripts/cartodb3/components/onboardings/georeference/georeference-launcher');
var AnalysesService = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var OnboardingsServiceModel = require('../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
// var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
// var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
// var QueryGeometryModel = require('../../../../../../javascripts/cartodb3/data/query-geometry-model');
// var QueryRowsCollection = require('../../../../../../javascripts/cartodb3/data/query-rows-collection');

describe('components/onboardings/georeference/georeference-launcher', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.l1 = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    // var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
    //   configModel: configModel,
    //   userModel: userModel
    // });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionsCollection.add(this.l1);

    spyOn(this.layerDefinitionsCollection, 'findNonGeoreferencedLayer');

    this.onboardings = new OnboardingsServiceModel();

    AnalysesService.init({
      onboardings: this.onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: {},
      userModel: userModel,
      configModel: configModel
    });

    this.onboardingNotification = {
      getKey: function () { return false; }
    };
  });

  describe('.setNonGeoreferencedLayerId', function () {
    beforeEach(function () {
      GeoreferenceOnboardingLauncher.init({
        onboardings: this.onboardings,
        onboardingNotification: this.onboardingNotification,
        layerDefinitionsCollection: this.layerDefinitionsCollection
      });
    });

    it('should call "findNonGeoreferencedLayer" within layer-definitions-collection', function () {
      GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();
      expect(this.layerDefinitionsCollection.findNonGeoreferencedLayer).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('should set layer id and launch georeference onboarding', function () {
      this.layerDefinitionsCollection.findNonGeoreferencedLayer.and.callFake(function (callback) {
        callback(this.l1);
      }.bind(this));
      spyOn(GeoreferenceOnboardingLauncher, 'launch');

      GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();
      expect(GeoreferenceOnboardingLauncher.launch).toHaveBeenCalled();
      expect(GeoreferenceOnboardingLauncher._layerId).toBe('l-1');
    });
  });

  describe('.launch', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.findNonGeoreferencedLayer.and.callFake(function (callback) {
        callback(this.l1);
      }.bind(this));
    });

    it('should do nothing if onboarding has been skipped', function () {
      // Arrange
      var onboardingNotification = {
        getKey: function () { return true; }
      };

      var onboardings = jasmine.createSpyObj('onboardings', ['create']);

      GeoreferenceOnboardingLauncher.init({
        onboardings: onboardings,
        onboardingNotification: onboardingNotification,
        layerDefinitionsCollection: this.layerDefinitionsCollection
      });

      // Act
      GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

      // Assert
      expect(onboardings.create).not.toHaveBeenCalled();
    });

    it('should return view with proper arguments if onboarding is active', function () {
      // Arrange
      GeoreferenceOnboardingLauncher.init({
        onboardings: this.onboardings,
        onboardingNotification: this.onboardingNotification,
        layerDefinitionsCollection: this.layerDefinitionsCollection
      });

      // Act
      GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

      // Assert
      expect(this.onboardings._onboardingView).toBeDefined();

      // Cleaning
      this.onboardings._onboardingView.remove();
      this.onboardings.destroy();
    });
  });
});
