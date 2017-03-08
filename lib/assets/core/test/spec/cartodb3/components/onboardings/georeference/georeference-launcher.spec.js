var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var GeoreferenceOnboardingLauncher = require('../../../../../../javascripts/cartodb3/components/onboardings/georeference/georeference-launcher');
var AnalysesService = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var OnboardingsServiceModel = require('../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../javascripts/cartodb3/data/query-geometry-model');
var QueryRowsCollection = require('../../../../../../javascripts/cartodb3/data/query-rows-collection');

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

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    var querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foo',
      status: 'fetched'
    }, {
      configModel: configModel
    });

    var queryGeometryModel = new QueryGeometryModel({
      status: 'fetched',
      simple_geom: '',
      query: 'SELECT * FROM foo'
    }, {
      configModel: configModel
    });

    var queryRowsCollection = new QueryRowsCollection([], {
      configModel: configModel,
      querySchemaModel: querySchemaModel
    });

    this.analysisDefinitionNodeModel = analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo',
      params: {
        query: 'SELECT * FROM foo'
      }
    });
    this.analysisDefinitionNodeModel.querySchemaModel = querySchemaModel;
    this.analysisDefinitionNodeModel.queryGeometryModel = queryGeometryModel;
    this.analysisDefinitionNodeModel.queryRowsCollection = queryRowsCollection;
    spyOn(this.l1, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionsCollection.add(this.l1);

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
    describe('if there are non georeferenced layers', function () {
      describe('without analysis, custom query, and not empty', function () {
        beforeEach(function () {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
            .andReturn({
              status: 200,
              responseText: '{"rows":[{},{},{}]}'
            });
        });

        afterEach(function () {
          jasmine.Ajax.uninstall();
        });

        it('should find layer', function () {
          // Arrange
          spyOn(this.analysisDefinitionNodeModel, 'isCustomQueryApplied').and.returnValue(false);

          GeoreferenceOnboardingLauncher.init({
            onboardings: {},
            onboardingNotification: this.onboardingNotification,
            layerDefinitionsCollection: this.layerDefinitionsCollection
          });
          spyOn(GeoreferenceOnboardingLauncher, 'launch');

          // Act
          GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

          // Assert
          expect(GeoreferenceOnboardingLauncher.launch).toHaveBeenCalled();
        });
      });

      describe('with analysis', function () {
        beforeEach(function () {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
            .andReturn({
              status: 200,
              responseText: '{"rows":[{},{},{}]}'
            });
        });

        afterEach(function () {
          jasmine.Ajax.uninstall();
        });

        it('should not find layer', function () {
          // Arrange
          spyOn(this.l1, 'hasAnalyses').and.returnValue(true);

          GeoreferenceOnboardingLauncher.init({
            onboardings: {},
            onboardingNotification: this.onboardingNotification,
            layerDefinitionsCollection: this.layerDefinitionsCollection
          });
          spyOn(GeoreferenceOnboardingLauncher, 'launch');

          // Act
          GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

          // Assert
          expect(GeoreferenceOnboardingLauncher.launch).not.toHaveBeenCalled();
        });
      });

      describe('with custom query', function () {
        beforeEach(function () {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
            .andReturn({
              status: 200,
              responseText: '{"rows":[{},{},{}]}'
            });
        });

        afterEach(function () {
          jasmine.Ajax.uninstall();
        });

        it('should not find layer', function () {
          // Arrange
          spyOn(this.analysisDefinitionNodeModel, 'isCustomQueryApplied').and.returnValue(true);

          GeoreferenceOnboardingLauncher.init({
            onboardings: {},
            onboardingNotification: this.onboardingNotification,
            layerDefinitionsCollection: this.layerDefinitionsCollection
          });
          spyOn(GeoreferenceOnboardingLauncher, 'launch');

          // Act
          GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

          // Assert
          expect(GeoreferenceOnboardingLauncher.launch).not.toHaveBeenCalled();
        });
      });

      describe('empty', function () {
        beforeEach(function () {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
            .andReturn({
              status: 200,
              responseText: '{"rows":[]}'
            });
        });

        afterEach(function () {
          jasmine.Ajax.uninstall();
        });

        it('should not find layer', function () {
          // Arrange
          GeoreferenceOnboardingLauncher.init({
            onboardings: {},
            onboardingNotification: this.onboardingNotification,
            layerDefinitionsCollection: this.layerDefinitionsCollection
          });
          spyOn(GeoreferenceOnboardingLauncher, 'launch');

          // Act
          GeoreferenceOnboardingLauncher.setNonGeoreferencedLayerId();

          // Assert
          expect(GeoreferenceOnboardingLauncher.launch).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('.launch', function () {
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
