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

describe('editor/layers/layer-content-view', function () {
  var dashboardCanvasEl;

  beforeEach(function () {
    dashboardCanvasEl = document.createElement('div');
    dashboardCanvasEl.className = 'CDB-Dashboard-canvas';
    document.body.appendChild(dashboardCanvasEl);

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
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

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: {},
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
      modals: {},
      onboardings: onboardings,
      analysis: {},
      userActions: {},
      vis: {},
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      editorModel: new EditorModel(),
      mapModeModel: {},
      stateDefinitionModel: {},
      onboardingNotification: onboardingNotification
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
    expect(_.size(this.view._subviews)).toBe(3);
    expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
    expect(this.view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
  });

  it('should go to prev stack layout step if arrow is clicked', function () {
    this.view.$('.js-back').click();
    expect(this.stackLayoutModel.prevStep).toHaveBeenCalledWith('layers');
  });

  describe('._renderContextButtons', function () {
    var analysisDefNodeModel;
    beforeEach(function () {
      analysisDefNodeModel = this.view._getAnalysisDefinitionNodeModel();
      spyOn(analysisDefNodeModel, 'isReadOnly');
      this.view._renderContextButtons();
    });

    it('should render context buttons properly', function () {
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherButton.js-showTable').length).toBe(1);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherButton.js-showMap').length).toBe(1);
    });

    it('should not display edit geometry buttons when node is read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem').length).toBe(3);
    });

    it('should not display edit geometry buttons when node is read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem').length).toBe(3);
    });
  });

  afterEach(function () {
    dashboardCanvasEl.parentNode.removeChild(dashboardCanvasEl);
    this.view.clean();
  });
});
