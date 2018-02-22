var Backbone = require('backbone');
var NodeGeometryTracker = require('builder/node-geometry-tracker');

describe('NodeGeometryTracker.track', function () {
  beforeEach(function () {
    this.layerDefinitionsCollection = new Backbone.Collection([
      {
        source: 'a0',
        id: 'l1'
      }
    ]);
    this.analysisDefinitionNodesCollection = new Backbone.Collection([
      {
        id: 'a0'
      }
    ]);
    this.analysisDefinitionsCollection = new Backbone.Collection();
    this.analysisDefinitionsCollection.saveAnalysisForLayer = function () {};
    spyOn(this.analysisDefinitionsCollection, 'saveAnalysisForLayer');

    NodeGeometryTracker.track({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection
    });
  });

  it('should save analysis if node geometry changes', function () {
    var nodeDefModel = this.analysisDefinitionNodesCollection.at(0);
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    nodeDefModel.set('simple_geom', 'line');
    expect(this.analysisDefinitionsCollection.saveAnalysisForLayer).toHaveBeenCalledWith(layerDefModel);
  });

  it('should not save analysis for the layer if node is source type', function () {
    var nodeDefModel = this.analysisDefinitionNodesCollection.at(0);
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    nodeDefModel.set({
      simple_geom: 'line',
      table_name: 'hello-kitty'
    });
    expect(this.analysisDefinitionsCollection.saveAnalysisForLayer).not.toHaveBeenCalledWith(layerDefModel);
  });
});
