var Backbone = require('backbone');
var SourceLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/source-layer-analysis-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var TableModel = require('../../../../../../javascripts/cartodb3/data/table-model');
var _ = require('underscore');

describe('editor/layers/analysis-views/source-layer-analysis-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      table_name: 'foo_bar',
      params: {
        query: 'SELECT * FROM foo_bar'
      }
    }], {
      configModel: this.configModel
    });
    this.sourceAnalysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get('a0');
    this.layerDefinitionModel = new Backbone.Model({user_name: 'somebody'});
    this.layerDefinitionModel.getQualifiedTableName = function () {};

    this.view = new SourceLayerAnalysisView({
      model: this.sourceAnalysisDefinitionNodeModel,
      analysisNode: this.sourceAnalysisDefinitionNodeModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.view.render();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('a0');
    expect(this.view.$el.text()).toContain('foo_bar');
  });

  describe('if layer is sync', function () {
    var syncView;

    beforeEach(function () {
      var table = new TableModel({
        id: 'harrr',
        name: 'another_table',
        synchronization: {
          id: 'test'
        }
      }, {
        parse: true,
        configModel: this.configModel
      });

      spyOn(this.sourceAnalysisDefinitionNodeModel, 'getTableModel').and.returnValue(table);

      syncView = new SourceLayerAnalysisView({
        model: this.sourceAnalysisDefinitionNodeModel,
        analysisNode: this.sourceAnalysisDefinitionNodeModel,
        layerDefinitionModel: this.layerDefinitionModel
      });

      syncView.render();
    });

    it('should render correctly', function () {
      expect(syncView.$el.html()).toContain('CDB-IconFont CDB-IconFont-wifi');
      expect(_.size(syncView._subviews)).toBe(1); // tooltip
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
