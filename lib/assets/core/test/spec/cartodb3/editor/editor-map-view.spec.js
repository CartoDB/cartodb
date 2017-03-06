var _ = require('underscore');
var Backbone = require('backbone');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var ModalsService = require('../../../../javascripts/cartodb3/components/modals/modals-service-model');
var OnboardingsServiceModel = require('../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
var EditorMapView = require('../../../../javascripts/cartodb3/editor/editor-map-view');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var Notifier = require('../../../../javascripts/cartodb3/components/notifier/notifier');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var PrivacyCollection = require('../../../../javascripts/cartodb3/components/modals/publish/privacy-collection');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var MapModeModel = require('../../../../javascripts/cartodb3/map-mode-model');
var AnalysesService = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/editor-map-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({ status: 200 });

    var configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito'
    });

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    var privacyCollection = new PrivacyCollection([{
      privacy: 'PUBLIC',
      title: 'Public',
      desc: 'Lorem ipsum',
      cssClass: 'is-green',
      selected: true
    }, {
      privacy: 'LINK',
      title: 'Link',
      desc: 'Yabadababa',
      cssClass: 'is-orange'
    }, {
      privacy: 'PASSWORD',
      title: 'Password',
      desc: 'Wadus'
    }, {
      privacy: 'PRIVATE',
      title: 'Private',
      desc: 'Funínculo',
      cssClass: 'is-red'
    }]);

    var basemapLayerDefModel = new LayerDefinitionModel({
      type: 'Tiled',
      name: 'Basemap is always first',
      urlTemplate: 'http://{s}.example.com/{z}/{x}/{y}.png'
    }, {
      configModel: configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      table_name: 'foobar'
    }, {
      configModel: configModel
    });

    this.layerDefinitionModel.styleModel = {
      isAnimation: function () {
        return false;
      }
    };

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: configModel,
      userModel: {}
    });

    spyOn(this.layerDefinitionModel, 'getNumberOfAnalyses').and.returnValue(3);
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      this.layerDefinitionModel,
      basemapLayerDefModel
    ], {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'My super fun vis',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var editorModel = new EditorModel();

    this.modals = new ModalsService();
    this.onboardings = new OnboardingsServiceModel();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);
    var widgetDefinitionsCollection = new Backbone.Collection();
    widgetDefinitionsCollection.widgetsOwnedByLayer = function () { return 0; };

    var mapModeModel = new MapModeModel();

    this.view = new EditorMapView({
      mapDefinitionModel: new Backbone.Model(),
      visDefinitionModel: visDefinitionModel,
      privacyCollection: privacyCollection,
      mapcapsCollection: mapcapsCollection,
      modals: this.modals,
      onboardings: this.onboardings,
      basemaps: {},
      userActions: {},
      analysis: {},
      vis: {},
      configModel: configModel,
      userModel: userModel,
      editorModel: editorModel,
      pollingModel: new Backbone.Model(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      legendDefinitionsCollection: new Backbone.Collection(),
      mapModeModel: mapModeModel,
      stateDefinitionModel: new Backbone.Model(),
      onboardingNotification: {}
    });

    Notifier.init({
      editorModel: editorModel
    });

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have two subview', function () {
    // Notifier is new subview
    expect(_.size(this.view._subviews)).toBe(2);
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('My super fun vis');
    expect(this.view.$el.text()).toContain('editor.tab-pane.layers.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.widgets.title-label');
  });

  describe('._onAddAnalysisClicked', function () {
    it('should add Analysis', function () {
      spyOn(AnalysesService, 'addAnalysis');

      this.view._onAddAnalysisClicked();

      expect(AnalysesService.addAnalysis).toHaveBeenCalled();
    });
  });

  describe('._onGeoreferenceClicked', function () {
    it('should add Georeference Analysis', function () {
      spyOn(AnalysesService, 'addGeoreferenceAnalysis');

      this.view._onGeoreferenceClicked();

      expect(AnalysesService.addGeoreferenceAnalysis).toHaveBeenCalled();
    });
  });
});
