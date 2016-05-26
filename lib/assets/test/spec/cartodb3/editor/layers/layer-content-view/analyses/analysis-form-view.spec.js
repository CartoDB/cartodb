var Backbone = require('backbone');
var cdb = require('cartodb.js');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysisFormView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-view');

describe('editor/layers/layer-content-view/analyses/analyses-form-view', function () {
  beforeEach(function () {
    this.layerDefModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    spyOn(this.layerDefModel, 'getAnalysisDefinitionNodeModel');

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      layerDefinitionModel: this.layerDefModel,
      analysisSourceOptionsModel: {}
    });
    this.analysisFormsCollection.add([
      {id: 'a1', type: 'buffer'},
      {id: 'a2', type: 'trade-area'}
    ]);

    this.viewModel = new cdb.core.Model({selectedNodeId: 'a2'});
    spyOn(AnalysisFormView.prototype, 'render').and.callThrough();
    this.view = new AnalysisFormView({
      analysisFormsCollection: this.analysisFormsCollection,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      viewModel: this.viewModel
    });
    this.view.render();
  });

  it('should render form', function () {
    expect(this.view.$el.html()).toContain('form');
  });

  describe('when selected node changes', function () {
    beforeEach(function () {
      this.viewModel.set('selectedNodeId', 'a1');
    });

    it('should render when selectedNodeId changes', function () {
      expect(this.view.render).toHaveBeenCalled();
      expect(this.view.$el.html()).toContain('form');
    });
  });

  it('should render controls', function () {
    expect(this.view.$el.html()).toContain('apply');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
