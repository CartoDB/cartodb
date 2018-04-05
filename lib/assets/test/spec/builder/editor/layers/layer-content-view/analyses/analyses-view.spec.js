var _ = require('underscore');
var Backbone = require('backbone');
var AnalysesView = require('builder/editor/layers/layer-content-views/analyses/analyses-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var UserNotifications = require('builder/data/user-notifications');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var OnboardingsServiceModel = require('builder/components/onboardings/onboardings-service-model');
var LayerContentModel = require('builder/data/layer-content-model');

var ONBOARDING_KEY = 'layer-analyses-onboarding';

describe('editor/layers/layer-content-views/analyses/analyses-view', function () {
  var analysisFormsCollection;
  var userActions;
  var layerDefinitionModel;
  var getQueryAndCheckStateSpy;
  var infoboxStateSpy;
  var initializeBackup = PanelWithOptionsView.prototype.initialize;
  var renderBackup = PanelWithOptionsView.prototype.render;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });

    this.onboardings = new OnboardingsServiceModel();
    this.onboardings.create = function () {};

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () {
      return false;
    };

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    spyOn(this.querySchemaModel, 'fetch');

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: {}
    });
    spyOn(this.queryGeometryModel, 'fetch');

    this.queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(this.queryRowsCollection, 'fetch');

    layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.canBeGeoreferenced = function () { return Promise.resolve(false); };
    layerDefinitionModel.toggleVisible = function () { };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return {
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        queryRowsCollection: this.queryRowsCollection
      };
    }.bind(this);

    var analysisDefinitionNodesCollection = new Backbone.Collection();
    analysisDefinitionNodesCollection.isEmpty = function () { return true; };

    userActions = jasmine.createSpyObj('userActions', ['saveLayer']);

    analysisFormsCollection = new Backbone.Collection();
    analysisFormsCollection.isEmpty = function () {
      return true;
    };

    var querySchemaModel = new Backbone.Model();
    querySchemaModel.hasRepeatedErrors = function () { return false; };

    var queryGeometryModel = new Backbone.Model();
    queryGeometryModel.hasRepeatedErrors = function () { return false; };

    var queryRowsCollection = new Backbone.Collection();
    queryRowsCollection.hasRepeatedErrors = function () { return false; };

    var layerContentModel = new LayerContentModel({}, {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    });

    getQueryAndCheckStateSpy = spyOn(AnalysesView.prototype, '_getQueryAndCheckState');
    infoboxStateSpy = spyOn(AnalysesView.prototype, '_infoboxState');

    this.view = new AnalysesView({
      userActions: userActions,
      analysisFormsCollection: analysisFormsCollection,
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      configModel: {},
      userModel: {},
      editorModel: this.editorModel,
      stackLayoutModel: {},
      onboardings: this.onboardings,
      onboardingNotification: onboardingNotification,
      layerContentModel: layerContentModel
    });

    PanelWithOptionsView.prototype.initialize = function () { };
    PanelWithOptionsView.prototype.render = function () { return this; };
  });

  afterEach(function () {
    PanelWithOptionsView.prototype.initialize = initializeBackup;
    PanelWithOptionsView.prototype.render = renderBackup;
  });

  describe('initialize', function () {
    it('should create _onboardingNotification', function () {
      expect(this.view._onboardingNotification).not.toBeUndefined();
      expect(this.view._onboardingNotification.get('key')).toBe('builder');
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_launchOnboarding');
      spyOn(this.view, '_initViews');

      this.view.render();

      expect(this.view._launchOnboarding).toHaveBeenCalled();
      expect(this.view._initViews).toHaveBeenCalled();
      expect(infoboxStateSpy).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    it('should check and set infobox state when there is a remove or reset in the analyses form collection', function () {
      analysisFormsCollection.reset([{ id: 'whatever' }]);

      expect(getQueryAndCheckStateSpy).toHaveBeenCalled();

      getQueryAndCheckStateSpy.calls.reset();

      analysisFormsCollection.remove(analysisFormsCollection.at(0));
      expect(getQueryAndCheckStateSpy.calls.count()).toBe(1);
    });

    it('should set infobox when layer visibility changes', function () {
      layerDefinitionModel.set('visible', false);

      expect(infoboxStateSpy).toHaveBeenCalled();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(1);
    });
  });

  describe('_getQueryAndCheckState', function () {
    describe('analysis forms collection is not empty', function () {
      it('should do nothing if onboarding was already skipped', function () {
        getQueryAndCheckStateSpy.and.callThrough();

        analysisFormsCollection.isEmpty = function () {
          return false;
        };

        this.view._getQueryAndCheckState();

        expect(infoboxStateSpy).toHaveBeenCalled();
      });
    });
  });

  describe('_launchOnboarding', function () {
    it('should do nothing if onboarding was already skipped', function () {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, true);
      spyOn(this.view._onboardingLauncher, 'launch');
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced');

      this.view._launchOnboarding();

      expect(this.view._layerDefinitionModel.canBeGeoreferenced).not.toHaveBeenCalled();
      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if there is an analysis', function (done) {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
      spyOn(this.view._analysisFormsCollection, 'isEmpty').and.returnValue(false);
      spyOn(this.view._onboardingLauncher, 'launch');
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));

      this.view._launchOnboarding();

      setTimeout(function () {
        expect(this.view._onboardingNotification.getKey(ONBOARDING_KEY)).toEqual(true);
        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
        done();
      }.bind(this), 0);
    });

    it('should create and launch onboarding', function (done) {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
      spyOn(this.view._analysisFormsCollection, 'isEmpty').and.returnValue(true);
      spyOn(this.view._onboardingLauncher, 'launch');
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(false));

      this.view._launchOnboarding();

      setTimeout(function () {
        expect(this.view._onboardingNotification.getKey(ONBOARDING_KEY)).toEqual(false);
        expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
        done();
      }.bind(this), 0);
    });

    it('should skip onboading if layer can be geocoded', function (done) {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));
      spyOn(this.view._onboardingNotification, 'setKey');

      this.view._launchOnboarding();

      setTimeout(function () {
        expect(this.view._onboardingNotification.setKey).toHaveBeenCalledWith(ONBOARDING_KEY, true);
        done();
      }.bind(this), 0);
    });
  });

  describe('._infoboxState', function () {
    beforeEach(function () {
      infoboxStateSpy.and.callThrough();

      spyOn(this.view, '_isLayerHidden').and.returnValue(false);
    });

    describe('if layer is hidden', function () {
      it('should set infobox state', function () {
        this.view._isLayerHidden.and.returnValue(true);

        this.view._infoboxState();

        expect(this.view._infoboxModel.get('state')).toBe('layer-hidden');
        expect(this.view._overlayModel.get('visible')).toBe(true);
      });
    });

    it('should set infobox state', function () {
      this.view._infoboxState();

      expect(this.view._infoboxModel.get('state')).toBe('');
      expect(this.view._overlayModel.get('visible')).toBe(false);
    });
  });

  describe('._showHiddenLayer', function () {
    it('should show layer if is visible', function () {
      spyOn(layerDefinitionModel, 'toggleVisible');

      this.view._showHiddenLayer();

      expect(layerDefinitionModel.toggleVisible).toHaveBeenCalled();
      expect(userActions.saveLayer).toHaveBeenCalledWith(layerDefinitionModel);
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layer is not visible', function () {
      layerDefinitionModel.set('visible', false);

      expect(this.view._isLayerHidden()).toBe(true);
    });
  });
});
