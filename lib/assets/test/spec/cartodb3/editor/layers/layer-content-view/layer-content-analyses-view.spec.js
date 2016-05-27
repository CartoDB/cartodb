var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
var AnalysisFormsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var LayerContentAnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/layer-content-analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var ModalsService = require('../../../../../../javascripts/cartodb3/components/modals/modals-service-model');

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

    this.modals = new ModalsService();

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    this.analysis.findNodeById.and.returnValue(new cdb.core.Model());

    this.analysisSourceOptionsModel = new cdb.core.Model();
    spyOn(this.analysisSourceOptionsModel, 'fetch');
    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    });

    this.view = new LayerContentAnalysesView({
      layerDefinitionModel: this.layerDefinitionModel,
      analysisFormsCollection: this.analysisFormsCollection,
      modals: this.modals,
      analysis: this.analysis
    });
    this.view.render();
  });

  describe('when layer has no analysis', function () {
    it('should render placeholder view', function () {
      expect(this.view.$el.html()).toContain('js-new-analysis');
    });

    it('should not render other view', function () {
      expect(_.size(this.view._subviews)).toBe(0);
    });

    describe('when click new-analysis', function () {
      beforeEach(function () {
        spyOn(AddAnalysisView.prototype, 'initialize').and.returnValue(new cdb.core.View());
        spyOn(AddAnalysisView.prototype, 'render').and.returnValue(function () {
          return this;
        });
        this.view.clean = _.once(this.view.clean);
        spyOn(this.modals, 'create').and.callThrough();
        this.view.$('.js-new-analysis').click();
      });

      afterEach(function () {
        jasmine.clock().install();
        this.modals.destroy();
        jasmine.clock().tick(1000);
        jasmine.clock().uninstall();
      });

      it('should open add-analysis modal', function () {
        expect(this.modals.create).toHaveBeenCalled();
        expect(AddAnalysisView.prototype.initialize).toHaveBeenCalled();
        expect(AddAnalysisView.prototype.initialize.calls.argsFor(0)[0].modalModel).toEqual(jasmine.any(Object));
        expect(AddAnalysisView.prototype.initialize.calls.argsFor(0)[0].analysisDefinitionNodeModel).toEqual(this.a0);
      });

      it('should not have any leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });
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
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$('.js-new-analysis').length).toBe(0);
    });

    // it('should use default selection (head)', function () {
      expect(this.view.viewModel.get('selectedNodeId')).toEqual('a1');
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
      expect(this.view.viewModel.get('selectedNodeId')).toEqual('a1');
    });

    it('should render form', function () {
      expect(this.view.$el.html()).toContain('a1');
    });
  });
});
