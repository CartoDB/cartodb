var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var AddAnalysisView = require('../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
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

describe('editor/editor-map-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
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
      configModel: configModel
    });

    spyOn(this.layerDefinitionModel, 'getNumberOfAnalyses').and.returnValue(3);
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);

    this.layerDefinitionsCollection = new Backbone.Collection([
      this.layerDefinitionModel,
      basemapLayerDefModel
    ]);

    var visDefinitionModel = new VisDefinitionModel({
      name: 'My super fun vis',
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

    var editorModel = new EditorModel();

    this.modals = new ModalsService();
    this.onboardings = new OnboardingsServiceModel();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

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
      widgetDefinitionsCollection: new Backbone.Collection(),
      legendDefinitionsCollection: new Backbone.Collection(),
      mapModeModel: mapModeModel
    });

    Notifier.init({
      editorModel: editorModel
    });

    this.view.render();
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
    expect(this.view.$el.text()).toContain('editor.tab-pane.elements.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.widgets.title-label');
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
      spyOn(this.view._stackLayoutView.model, 'goToStep');

      var ev = {currentTarget: $('<button data-layer-id="l-1">Add analysis</button')[0]};
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
        expect(this.view._stackLayoutView.model.goToStep).toHaveBeenCalledWith(1, this.layerDefinitionModel, 'layer-content', this.analysisFormAttrs);
      });
    });
  });
});
