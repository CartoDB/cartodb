var Backbone = require('backbone');
var cdb = require('cartodb.js');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var LayerContentAnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/layer-content-analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/layer-content-analyses-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

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
    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: this.configModel,
      collection: new Backbone.Collection()
    });
    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    this.analysis.findNodeById.and.returnValue(new cdb.core.Model());

    this.analysisSourceOptionsModel = new cdb.core.Model();
    spyOn(this.analysisSourceOptionsModel, 'fetch');
    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    });

    this.view = new LayerContentAnalysesView({
      analysis: this.analysis,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      analysisFormsCollection: this.analysisFormsCollection,
      layerDefinitionModel: this.layerDefinitionModel
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
        time: '100'
      }, {
        configModel: this.configModel,
        collection: new cdb.Backbone.Collection()
      });
      spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);
      this.analysisFormsCollection.add(this.a1.attributes, {at: 0});

      this.layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(this.a1);
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
        this.analysis.findNodeById.and.returnValue(null);
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
        type: 'buffer'
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
