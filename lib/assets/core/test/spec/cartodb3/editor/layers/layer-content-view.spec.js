var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerContentView = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-view');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');
var UserNotifications = require('../../../../../javascripts/cartodb3/data/user-notifications');
var AnalysesService = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var FactoryModals = require('../../factories/modals');

describe('editor/layers/layer-content-view/lcv', function () {
  var dashboardCanvasEl;

  beforeEach(function () {
    dashboardCanvasEl = document.createElement('div');
    dashboardCanvasEl.className = 'CDB-Dashboard-canvas';
    document.body.appendChild(dashboardCanvasEl);

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe',
      sql_api_protocol: 'http'
    });

    this.userModel = new UserModel({}, {
      configModel: configModel,
      username: 'pepe'
    });

    this.mapDefModel = new Backbone.Model({
      legends: true
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    var onboardings = new Backbone.Model();
    onboardings.create = function () {};
    onboardings.destroy = function () {};

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: configModel,
      userModel: this.userModel,
      collection: new Backbone.Collection()
    });

    this.analysisDefinitionNodeModel.querySchemaModel.attributes.query = 'SELECT * FROM foo';

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add(this.layer);

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    this.widgetDefinitionsCollection.isThereOtherWidgets = function () {
      return false;
    };

    spyOn(this.layer, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);
    spyOn(this.layer, 'findAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });
    this.visDefinitionModel = new Backbone.Model();
    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: FactoryModals.createModalService(),
      userModel: this.userModel,
      configModel: configModel
    });

    this.view = new LayerContentView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      legendDefinitionsCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      userModel: this.userModel,
      modals: FactoryModals.createModalService(),
      onboardings: onboardings,
      analysis: {},
      userActions: {},
      vis: {},
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      editorModel: new EditorModel(),
      mapModeModel: {},
      stateDefinitionModel: {},
      onboardingNotification: onboardingNotification,
      visDefinitionModel: this.visDefinitionModel
    });

    this.view.render();
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(_.size(this.view._subviews)).toBe(2);
    expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
    expect(this.view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
    // Onboarding
    expect(this.view.$('.js-editorPanelContent').length).toBe(1);
  });

  it('should go to prev stack layout step if arrow is clicked', function () {
    this.view.$('.js-back').click();
    expect(this.stackLayoutModel.prevStep).toHaveBeenCalledWith('layers');
  });

  describe('._renderContextButtons', function () {
    var analysisDefNodeModel;
    var layerDefinitionModel;
    beforeEach(function () {
      analysisDefNodeModel = this.view._getAnalysisDefinitionNodeModel();
      layerDefinitionModel = this.view._layerDefinitionModel;
      spyOn(analysisDefNodeModel, 'isReadOnly');
      this.view._renderContextButtons();
    });

    it('should render context buttons properly', function () {
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherButton.js-showTable').length).toBe(1);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherButton.js-showMap').length).toBe(1);
    });

    it('should enable edit geometry buttons when node is visible and not read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom.is-disabled').length).toBe(0);
    });

    it('should disable edit geometry buttons when node is read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom.is-disabled').length).toBe(1);
    });

    it('should disable edit geometry buttons when node is not visible', function () {
      layerDefinitionModel.set('visible', false);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom.is-disabled').length).toBe(1);
    });

    it('should not show tooltip when node is visible and not read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom[data-tooltip]').length).toBe(0);
    });

    it('should show tooltip when node is read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom[data-tooltip]').length).toBe(1);
    });

    it('should show tooltip when node is not visible', function () {
      layerDefinitionModel.set('visible', false);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher--geom[data-tooltip]').length).toBe(1);
    });
  });

  describe('._initBinds', function () {
    function buildResponse (geom) {
      return {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: '{"rows":[{"the_geom":"' + geom + '"}],"time":0.005,"fields":{"the_geom":{"type":"string"}},"total_rows":1}'
      };
    }

    beforeEach(function () {
      jasmine.Ajax.install();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should fetch queryGeometryModel if shouldFetch is true', function () {
      var queryGeometryModel = this.view._getQueryGeometryModel();
      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse('line'));
      spyOn(queryGeometryModel, 'fetch');
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');

      this.view._initBinds();

      expect(queryGeometryModel.fetch).toHaveBeenCalled();
    });

    it('should call _renderContextButtons and set default style properties if there is a change in simple_geom to a valid value', function () {
      var queryGeometryModel = this.view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(this.view, '_renderContextButtons');
      spyOn(this.view, 'render');
      spyOn(this.view._layerDefinitionModel.styleModel, 'setDefaultPropertiesByType');
      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse('polygon'));
      this.view._initBinds();

      queryGeometryModel.set('simple_geom', 'polygon');

      expect(this.view._layerDefinitionModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalled();
      expect(this.view.render).toHaveBeenCalled();
      expect(this.view._renderContextButtons).toHaveBeenCalled();
    });

    it('should call _renderContextButtons and not set default style properties if there is a change in simple_geom to nothing', function () {
      var queryGeometryModel = this.view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(this.view, '_renderContextButtons');
      spyOn(this.view._layerDefinitionModel.styleModel, 'setDefaultPropertiesByType');
      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse(''));
      this.view._initBinds();

      queryGeometryModel.set('simple_geom', '');

      expect(this.view._layerDefinitionModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
      expect(this.view._renderContextButtons).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    dashboardCanvasEl.parentNode.removeChild(dashboardCanvasEl);
    this.view.clean();
  });
});
