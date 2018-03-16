var _ = require('underscore');
var Backbone = require('backbone');
var ModalsService = require('builder/components/modals/modals-service-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var EditorPane = require('builder/editor/editor-pane');
var EditorModel = require('builder/data/editor-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var AppNotifications = require('builder/app-notifications');

describe('editor/editor-pane', function () {
  var analysisDefinitionNodeModel;
  var handleRouteSpy;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.clock().install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({
        status: 200,
        responseText: '{"rows":[{},{},{}]}'
      });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    AppNotifications.init();

    this.userModel = new UserModel({
      limits: {
        max_layers: 2
      },
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, {
      configModel: this.configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel,
      stateDefinitionModel: {}
    });

    var querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foo',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });

    var queryGeometryModel = new QueryGeometryModel({
      status: 'fetched',
      simple_geom: '',
      query: 'SELECT * FROM foo'
    }, {
      configModel: this.configModel
    });

    var queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: querySchemaModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    analysisDefinitionNodeModel = analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo',
      params: {
        query: 'SELECT * FROM foo'
      }
    });
    analysisDefinitionNodeModel.querySchemaModel = querySchemaModel;
    analysisDefinitionNodeModel.querySchemaModel.hasGeometryData = function () {
      return true;
    };
    analysisDefinitionNodeModel.queryGeometryModel = queryGeometryModel;
    analysisDefinitionNodeModel.queryRowsCollection = queryRowsCollection;

    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(analysisDefinitionNodeModel);

    this.privacyCollection = new PrivacyCollection([{
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

    this.widgetDefinitionsCollection = new Backbone.Collection();

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: this.configModel
    });

    this.mapStackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'nextStep', 'goToStep']);

    this.modals = new ModalsService();

    this.mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      this.layerDefinitionModel
    ], {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.loadAllQueryGeometryModels = function (callback) {
      callback();
    };

    spyOn(this.layerDefinitionsCollection, 'isThereAnyGeometryData').and.returnValue(Promise.resolve(true));

    this.onboardingNotification = {
      getKey: function () { return false; }
    };

    handleRouteSpy = spyOn(EditorPane.prototype, '_handleRoute');

    this.view = new EditorPane({
      visDefinitionModel: this.visDefinitionModel,
      modals: this.modals,
      privacyCollection: this.privacyCollection,
      mapcapsCollection: this.mapcapsCollection,
      analysis: {},
      userActions: {},
      userModel: this.userModel,
      editorModel: new EditorModel(),
      pollingModel: new Backbone.Model(),
      configModel: this.configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      mapStackLayoutModel: this.mapStackLayoutModel,
      selectedTabItem: 'widgets',
      stateDefinitionModel: {},
      onboardingNotification: this.onboardingNotification,
      routeModel: new Backbone.Model()
    });

    this.view.render();
  });

  afterEach(function () {
    AppNotifications.off();
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('Foo Map');
    expect(this.view.$el.text()).toContain('editor.tab-pane.layers.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.widgets.title-label');
    expect(this.view.$el.text()).toContain('editor.button_publish');
  });

  it('should create PanelWithOptionsView with selector for onboarding', function () {
    var contentView = this.view._mapTabPaneView.collection.at(0).attributes.createContentView();

    expect(contentView.className).toEqual('Editor-content js-editorPanelContent');
  });

  it('should have two subviews', function () {
    expect(_.size(this.view._subviews)).toBe(2); // [Header, TabPane]
  });

  describe('._onLayerAdd', function () {
    it('should fetch visualization privacy if a new layer is added', function () {
      var layerDefModel2 = new LayerDefinitionModel({
        id: 'l-101',
        kind: 'carto'
      }, {
        parse: true,
        configModel: this.configModel,
        stateDefinitionModel: {}
      });
      layerDefModel2.getAnalysisDefinitionNodeModel = function () {
        return analysisDefinitionNodeModel;
      };

      spyOn(this.view._visDefinitionModel, 'fetch');
      this.view._layerDefinitionsCollection.add(layerDefModel2);
      jasmine.clock().tick(10);

      expect(this.view._visDefinitionModel.fetch).toHaveBeenCalled();
    });

    it('should call zoomToData if origin is table', function () {
      var layerDefModel2 = new LayerDefinitionModel({
        id: 'l-101',
        kind: 'carto'
      }, {
        parse: true,
        configModel: this.configModel,
        stateDefinitionModel: {}
      });
      layerDefModel2.getAnalysisDefinitionNodeModel = function () {
        return analysisDefinitionNodeModel;
      };

      spyOn(this.view, '_zoomToData');

      this.view._layerDefinitionsCollection.add(layerDefModel2, { origin: 'table' });
      jasmine.clock().tick(10);

      expect(this.view._zoomToData).toHaveBeenCalled();
    });
  });

  describe('max layers', function () {
    var otherLayer = new LayerDefinitionModel({
      id: 'l-2',
      options: {
        type: 'torque',
        table_name: 'fee',
        source: 'a1'
      }
    }, {
      parse: true,
      configModel: new ConfigModel({
        base_url: '/u/pepe',
        user_name: 'pepe'
      }),
      stateDefinitionModel: {}
    });
    otherLayer.getAnalysisDefinitionNodeModel = function () {
      return analysisDefinitionNodeModel;
    };

    afterEach(function () {
      this.view._layerDefinitionsCollection.remove(otherLayer);
    });

    it('should have no infobox state by default', function () {
      expect(this.view._infoboxModel.get('state')).toBe(null);
    });

    it('should show the max-layers infobox when max layer are reached', function () {
      this.view._layerDefinitionsCollection.add(otherLayer);
      jasmine.clock().tick(10);

      expect(this.view._infoboxModel.get('state')).not.toBe(null);
    });

    it('should remove the max-layers infobox when max layer is not reached', function () {
      this.view._layerDefinitionsCollection.add(otherLayer);
      jasmine.clock().tick(10);

      this.view._layerDefinitionsCollection.remove(otherLayer);
      expect(this.view._infoboxModel.get('state')).toBe(null);
    });

    it('should show the limit infobox if there is a limit notification', function () {
      AppNotifications.addNotification({ type: 'limit' });

      this.view.render();

      expect(this.view._infoboxModel.get('state')).toBe('limit');
      expect(this.view.$('.Infobox').length).toBe(1);
      expect(this.view.$('.Infobox').html()).toContain('editor.messages.limit');
    });
  });

  describe('._initBinds', function () {
    it('should call _handleRoute when _routeModel:currentRoute changes', function () {
      this.view._routeModel.set({ currentRoute: 'widgets' });
      expect(this.view._handleRoute).toHaveBeenCalled();
    });
  });

  describe('._handleRoute', function () {
    it('should set the correct tab pane', function () {
      handleRouteSpy.and.callThrough();
      spyOn(this.view._mapTabPaneView, 'setSelectedTabPaneByName');
      var routeModel = new Backbone.Model({
        currentRoute: ['layers']
      });

      this.view._handleRoute(routeModel);

      expect(this.view._mapTabPaneView.setSelectedTabPaneByName).toHaveBeenCalledWith('layers');

      routeModel.set({ currentRoute: ['widgets'] }, { silent: true });
      this.view._handleRoute(routeModel);

      expect(this.view._mapTabPaneView.setSelectedTabPaneByName).toHaveBeenCalledWith('widgets');
    });
  });
});
