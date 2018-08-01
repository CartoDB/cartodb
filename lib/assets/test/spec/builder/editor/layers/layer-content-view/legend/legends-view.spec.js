var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LegendsView = require('builder/editor/layers/layer-content-views/legend/legends-view');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var LayerContentModel = require('builder/data/layer-content-model');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var FactoryModals = require('../../../../factories/modals');
var sqlErrorTemplate = require('builder/editor/layers/layer-content-views/legend/legend-content-sql-error.tpl');
var actionErrorTemplate = require('builder/editor/layers/sql-error-action.tpl');
var StyleModel = require('builder/editor/style/style-definition-model');
var StyleConstants = require('builder/components/form-components/_constants/_style');

describe('editor/layers/layer-content-view/legend/legends-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

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

    this.mapDefModel = new Backbone.Model({
      legends: true
    });

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };
    this.editorModel.isDisabled = function () { return false; };

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    });
    spyOn(this.a0, 'isCustomQueryApplied').and.returnValue(false);

    this.layerDefinitionCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'abc-123',
      kind: 'carto',
      options: {
        type: 'CartoDB',
        color: '#FABADA',
        table_name: 'foo',
        query: 'SELECT * FROM foo',
        tile_style: 'asdasd',
        visible: true
      }
    }, {
      parse: true,
      configModel: this.configModel,
      collection: this.layerDefinitionCollection
    });
    spyOn(this.layerDefinitionModel, 'save');
    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.layerDefinitionModel.styleModel = new StyleModel({
      type: StyleConstants.Type.SIMPLE,
      fill: {
        color: {
          fixed: '#892b27'
        },
        size: {
          attribute: 10
        }
      }
    });

    this.legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: {},
      layerDefinitionsCollection: new Backbone.Collection(),
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    spyOn(LegendsView.prototype, '_changeStyle');

    this.queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(this.queryRowsCollection, 'fetch');

    this.layerContentModel = new LayerContentModel({}, {
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: this.queryGeometryModel,
      queryRowsCollection: this.queryRowsCollection
    });

    this.view = new LegendsView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      editorModel: this.editorModel,
      queryGeometryModel: this.queryGeometryModel,
      layerContentModel: this.layerContentModel,
      userActions: {
        saveLayer: jasmine.createSpy('saveLayer')
      },
      userModel: this.userModel,
      configModel: this.configModel,
      modals: FactoryModals.createModalService()
    });

    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1); // [TabPaneView]
      expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.color');
      expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.size');
    });

    it('should render error template if layer content model is errored', function () {
      spyOn(this.layerContentModel, 'isErrored').and.returnValue(true);
      var errorTemplate = _t('editor.error-query.body', {
        action: actionErrorTemplate({
          label: _t('editor.error-query.label')
        })
      });

      this.view.render();

      expect(this.view.el.innerHTML).toBe(sqlErrorTemplate({ body: errorTemplate }));
    });
  });

  it('should show/hide overlay properly', function () {
    this.layerDefinitionModel.set('visible', false);
    expect(this.view._overlayModel.get('visible')).toBe(true);

    this.layerDefinitionModel.set('visible', true);
    expect(this.view._overlayModel.get('visible')).toBe(false);
  });

  describe('._initModels', function () {
    it('should create _infoboxModel', function () {
      this.view._infoboxModel = undefined;
      expect(this.view._infoboxModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._infoboxModel).toBeDefined();
    });

    it('should create _overlayModel', function () {
      this.view._overlayModel = undefined;
      expect(this.view._overlayModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._overlayModel).toBeDefined();
    });
  });

  describe('._initBinds', function () {
    it('should call _changeStyle when editorModel:edition changes', function () {
      this.editorModel.set({ edition: true });

      expect(LegendsView.prototype._changeStyle).toHaveBeenCalled();
    });
  });

  describe('._isErrored', function () {
    it('should return layerContentModel isErrored', function () {
      var isErroredSpy = spyOn(this.view._layerContentModel, 'isErrored');

      isErroredSpy.and.returnValue(false);
      expect(this.view._isErrored()).toBe(false);

      isErroredSpy.and.returnValue(true);
      expect(this.view._isErrored()).toBe(true);
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layerDefinitionModel.visible is false', function () {
      this.layerDefinitionModel.set('visible', false, { silent: true });
      expect(this.view._isLayerHidden()).toBe(true);

      this.layerDefinitionModel.set('visible', true, { silent: true });
      expect(this.view._isLayerHidden()).toBe(false);
    });
  });

  describe('._showHiddenLayer', function () {
    it('should call layerDefinitionModel.toggleVisible', function () {
      spyOn(this.view._layerDefinitionModel, 'toggleVisible');

      this.view._showHiddenLayer();

      expect(this.view._layerDefinitionModel.toggleVisible).toHaveBeenCalled();
    });

    it('should call userActions.saveLayer', function () {
      this.view._showHiddenLayer();
      expect(this.view._userActions.saveLayer).toHaveBeenCalled();
    });
  });

  describe('.isStyleCompatible', function () {
    it('should return true if legend type is not size', function () {
      expect(this.view._isStyleCompatible('color')).toBe(true);
    });

    it('should return true if any of the legends size is compatible', function () {
      expect(this.view._isStyleCompatible('size')).toBe(true);
    });

    it('should return false if no legend size is compatible', function () {
      this.view._layerDefinitionModel.styleModel = new StyleModel({});
      expect(this.view._isStyleCompatible('size')).toBe(false);
    });
  });

  describe('when layer has errors', function () {
    beforeEach(function () {
      spyOn(this.view, '_isErrored').and.returnValue(true);
      this.view.render();
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(this.view.$el.text()).toContain('editor.error-query.body');
      });
    });

    describe('._onQueryChanged', function () {
      it('should call render', function () {
        spyOn(this.view, 'render');

        this.view._onQueryChanged();

        expect(this.view.render).toHaveBeenCalled();
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
