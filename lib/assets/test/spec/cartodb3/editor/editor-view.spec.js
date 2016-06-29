var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ModalsService = require('../../../../javascripts/cartodb3/components/modals/modals-service-model');
var AddAnalysisView = require('../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorView = require('../../../../javascripts/cartodb3/editor/editor-view');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('editor/editor-view', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-100',
      kind: 'carto'
    }, {
      parse: true,
      configModel: {}
    });

    this.widgetDefinitionsCollection = new Backbone.Collection();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
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

    this.view = new EditorView({
      visDefinitionModel: visDefinitionModel,
      modals: this.modals,
      analysis: {},
      userActions: {},
      userModel: userModel,
      editorModel: new EditorModel(),
      pollingModel: new Backbone.Model(),
      configModel: {},
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection([this.layerDefinitionModel]),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      mapStackLayoutModel: this.mapStackLayoutModel,
      selectedTabItem: 'widgets'
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

  describe('._onAddAnalysisClicked', function () {
    beforeEach(function () {
      jasmine.clock().install();
      this.mockView = new CoreView();
      spyOn(AddAnalysisView.prototype, 'initialize');
      spyOn(AddAnalysisView.prototype, 'render').and.returnValue(this.mockView);
      spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.model);
      spyOn(this.modals, 'create').and.callThrough();
      spyOn(this.modals, 'onDestroyOnce').and.callThrough();

      var ev = {currentTarget: $('<button data-layer-id="' + this.layerDefinitionModel.id + '">Add analysis</button')[0]};
      this.view._onAddAnalysisClicked(ev);
    });

    afterEach(function () {
      this.modals.destroy();
      jasmine.clock().tick(2000);
      jasmine.clock().uninstall();
    });

    it('should open a modal', function () {
      expect(this.modals.create).toHaveBeenCalled();
    });

    it('should open a modal add-analysis-view', function () {
      expect(AddAnalysisView.prototype.render).toHaveBeenCalled();
    });

    describe('when modal is destroyed', function () {
      beforeEach(function () {
        this.analysisFormAttrs = {id: 'a1', type: 'buffer'};
        var destroyOnceArgs = this.modals.onDestroyOnce.calls.argsFor(0);
        destroyOnceArgs[0].call(destroyOnceArgs[1], this.analysisFormAttrs);
      });

      it('should redirect stack to layer-content', function () {
        expect(this.mapStackLayoutModel.goToStep).toHaveBeenCalledWith(1, this.layerDefinitionModel, 'layer-content', this.analysisFormAttrs);
      });
    });
  });
});
