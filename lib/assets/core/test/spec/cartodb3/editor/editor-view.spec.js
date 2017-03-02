var _ = require('underscore');
var Backbone = require('backbone');
var ModalsService = require('../../../../javascripts/cartodb3/components/modals/modals-service-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorView = require('../../../../javascripts/cartodb3/editor/editor-view');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var PrivacyCollection = require('../../../../javascripts/cartodb3/components/modals/publish/privacy-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../javascripts/cartodb3/data/query-geometry-model');
var QueryRowsCollection = require('../../../../javascripts/cartodb3/data/query-rows-collection');

describe('editor/editor-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({
        status: 200,
        responseText: '{"rows":[]}'
      });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, {
      configModel: configModel
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
      configModel: {},
      stateDefinitionModel: {}
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

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
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
    this.analysisDefinitionNodeModel.querySchemaModel.hasGeometryData = function () {
      return true;
    };
    this.analysisDefinitionNodeModel.queryGeometryModel = queryGeometryModel;
    this.analysisDefinitionNodeModel.queryRowsCollection = queryRowsCollection;

    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

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

    this.widgetDefinitionsCollection = new Backbone.Collection();

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    this.mapStackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'nextStep', 'goToStep']);

    this.modals = new ModalsService();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      this.layerDefinitionModel
    ], {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.loadAllQueryGeometryModels = function (callback) {
      callback();
    };

    this.layerDefinitionsCollection.isThereAnyGeometryData = function () {
      return this.some(function (layerDefModel) {
        var querySchemaModel = layerDefModel.getAnalysisDefinitionNodeModel().querySchemaModel;
        return querySchemaModel.hasGeometryData();
      });
    };

    var onboardingNotification = {
      getKey: function () { return false; }
    };

    this.view = new EditorView({
      visDefinitionModel: visDefinitionModel,
      modals: this.modals,
      privacyCollection: privacyCollection,
      mapcapsCollection: mapcapsCollection,
      analysis: {},
      userActions: {},
      userModel: userModel,
      editorModel: new EditorModel(),
      pollingModel: new Backbone.Model(),
      configModel: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      mapStackLayoutModel: this.mapStackLayoutModel,
      selectedTabItem: 'widgets',
      stateDefinitionModel: {},
      onboardingNotification: onboardingNotification
    });
    spyOn(this.view, '_findNonGeoreferencedLayer');

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('editor.button_add');
  });

  it('should have two subviews', function () {
    expect(_.size(this.view._subviews)).toBe(2);
  });

  it('should check/fetch visualization privacy if a new layer is added', function () {
    var layerDefModel2 = new LayerDefinitionModel({
      id: 'l-101',
      kind: 'carto'
    }, {
      parse: true,
      configModel: {},
      stateDefinitionModel: {}
    });
    spyOn(layerDefModel2, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

    spyOn(this.view._visDefinitionModel, 'fetch');
    this.view._layerDefinitionsCollection.add(layerDefModel2);
    expect(this.view._visDefinitionModel.fetch).toHaveBeenCalled();
  });

  describe('add button', function () {
    beforeEach(function () {
      this.widgetDefModel = new WidgetDefinitionModel({
        type: 'formula',
        title: 'formula example',
        layer_id: 'l-1',
        column: 'areas',
        operation: 'avg',
        order: 0
      }, {
        configModel: {},
        mapId: 'm-123'
      });
    });

    it('should be displayed when there are items on the selected tab', function () {
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeTruthy();

      this.widgetDefinitionsCollection.add(this.widgetDefModel);
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeFalsy();
    });

    it('should be hidden when an item is removed', function () {
      this.widgetDefinitionsCollection.add(this.widgetDefModel);
      this.widgetDefinitionsCollection.reset([]);
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeTruthy();
    });
  });
});
