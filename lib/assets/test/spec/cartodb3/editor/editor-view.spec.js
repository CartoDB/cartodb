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

describe('editor/editor-view', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-100',
      kind: 'carto'
    }, {
      parse: true,
      configModel: {},
      stateDefinitionModel: {}
    });

    this.analysisDefinitionNodeModel = new Backbone.Model();
    this.analysisDefinitionNodeModel.querySchemaModel = new Backbone.Model();
    this.analysisDefinitionNodeModel.querySchemaModel.hasGeometryData = function () {
      return true;
    };
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

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, { configModel: configModel });

    this.mapStackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'nextStep', 'goToStep']);

    this.modals = new ModalsService();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

    this.layerDefinitionsCollection = new Backbone.Collection([
      this.layerDefinitionModel
    ], {
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
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      mapStackLayoutModel: this.mapStackLayoutModel,
      selectedTabItem: 'widgets',
      stateDefinitionModel: {}
    });

    this.view.render();
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
    spyOn(this.view._visDefinitionModel, 'fetch');
    this.view._layerDefinitionsCollection.add(layerDefModel2);
    expect(this.view._visDefinitionModel.fetch).toHaveBeenCalled();
  });

  describe('add button', function () {
    beforeEach(function () {
      this.widgetDefModel = new WidgetDefinitionModel({
        type: 'formula',
        title: 'formula example',
        layer_id: 'l-100',
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
