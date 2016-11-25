var Backbone = require('backbone');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var LayerContentAnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/layer-content-analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');

describe('editor/layers/layer-content-view/layer-content-analyses-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.overlayModel = new Backbone.Model({
      visible: false
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel
    });

    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    });

    var userModel = new UserModel({
      username: 'pepe',
      quota: {}
    }, {
      configModel: this.configModel
    });
    spyOn(userModel, 'fetch');

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      configModel: this.configModel,
      collection: new Backbone.Collection(),
      parse: true
    });

    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
      switch (id) {
        case 'a0': return this.a0;
        case 'a1': return this.a1;
      }
    }.bind(this));

    this.userActions = UserActions({
      userModel: userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'saveAnalysis');
    spyOn(this.userActions, 'deleteAnalysisNode');

    this.analysisSourceOptionsModel = new Backbone.Model();
    spyOn(this.analysisSourceOptionsModel, 'fetch');
    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      configModel: this.configModel,
      userModel: userModel,
      userActions: this.userActions,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    });

    this.view = new LayerContentAnalysesView({
      userActions: this.userActions,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisFormsCollection: this.analysisFormsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      userModel: userModel,
      configModel: this.configModel,
      stackLayoutModel: {},
      overlayModel: this.overlayModel
    });
    this.view.render();
  });

  describe('when layer has no analysis', function () {
    it('should render placeholder', function () {
      expect(this.view.$el.html()).toContain('placeholder-text');
    });

    it('should have add-analysis button', function () {
      expect(this.view.$el.html()).toContain('js-add-analysis');
      expect(this.view.$('.js-add-analysis').length).toEqual(1);
      expect(this.view.$('.js-add-analysis').data('layer-id')).toEqual('l-1');
    });
  });

  describe('when a new node is added to layer definition', function () {
    beforeEach(function () {
      this.a1 = new AnalysisDefinitionNodeModel({
        id: 'a1',
        type: 'trade-area',
        kind: 'walk',
        time: '100',
        source: 'a0'
      }, {
        configModel: this.configModel,
        collection: new Backbone.Collection()
      });
      this.layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(this.a1);
      spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);
      this.analysisFormsCollection.add(this.a1.attributes, {at: 0});

      this.layerDefinitionModel.set('source', 'a1');
    });

    it('should render workflow and analysis form views', function () {
      expect(this.view.$el.html()).not.toContain('placeholder-text');
    });

    it('should have a add-analysis button', function () {
      expect(this.view.$el.html()).toContain('js-add-analysis');
      expect(this.view.$('.js-add-analysis').length).toEqual(1);
      expect(this.view.$('.js-add-analysis').data('layer-id')).toEqual('l-1');
    });

    it('should use default selection (head)', function () {
      expect(this.view._viewModel.get('selectedNodeId')).toEqual('a1');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    describe('when there is no corresponding analysis yet (e.g. form representing new item)', function () {
      beforeEach(function () {
        this.analysisDefinitionNodesCollection.reset([]);
        this.layerDefinitionModel.set('source', 'a0', {silent: true});
        this.layerDefinitionModel.set('source', 'a1');
      });

      it('should use form as fallback model', function () {
        expect(this.view.$el.html()).toContain('a1'); // should not throw any error
      });
    });
  });

  describe('when a new form model is added', function () {
    beforeEach(function () {
      this.analysisFormsCollection.addHead({
        id: 'a1',
        type: 'buffer',
        source: 'a0'
      });
    });

    it('should select new node', function () {
      expect(this.view._viewModel.get('selectedNodeId')).toEqual('a1');
    });

    it('should render form', function () {
      expect(this.view.$el.html()).toContain('a1');
    });
  });
});
