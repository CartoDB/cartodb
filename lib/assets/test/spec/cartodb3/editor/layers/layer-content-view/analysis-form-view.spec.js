var cdb = require('cartodb.js');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var AnalysisFormView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analysis-form-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/analyses-form-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new cdb.Backbone.Collection();
    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });
    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'trade-area',
      source: 'a0'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });
    this.analysisDefinitionNodesCollection.add([this.a0, this.a1]);

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a1',
        letter: 'a'
      }
    }, {
      parse: true,
      collection: new Backbone.Collection(),
      configModel: configModel
    });

    this.viewModel = new cdb.core.Model({selectedNode: this.a1});
    spyOn(AnalysisFormView.prototype, 'render');
    this.view = new AnalysisFormView({
      layerDefinitionModel: this.layer,
      viewModel: this.viewModel
    });
    this.view.render();
  });

  it('should render when selectedNode changes', function () {
    this.viewModel.set('selectedNode', this.a0);
    expect(this.view.render).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
