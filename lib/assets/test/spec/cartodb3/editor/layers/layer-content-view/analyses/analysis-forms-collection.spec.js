var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisSourceOptionsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');

describe('editor/layers/layer-content-view/analyses/analysis-forms-collection', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new Backbone.Collection();
    var nodeOpts = {
      configModel: {},
      collection: this.analysisDefinitionNodesCollection
    };
    this.a0 = new AnalysisDefinitionNodeModel({id: 'a0', type: 'trade-area'}, nodeOpts);
    spyOn(this.a0, 'hasPrimarySource').and.returnValue(false);

    this.a1 = new AnalysisDefinitionNodeModel({id: 'a1', type: 'buffer'}, nodeOpts);
    spyOn(this.a1, 'hasPrimarySource').and.returnValue(true);
    spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);

    this.a2 = new AnalysisDefinitionNodeModel({id: 'a2', type: 'source'}, nodeOpts);
    spyOn(this.a2, 'hasPrimarySource').and.returnValue(true);
    spyOn(this.a2, 'getPrimarySource').and.returnValue(this.a1);

    this.analysisDefinitionNodesCollection.reset([this.a0, this.a1, this.a2]);

    this.layerDefModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a2',
        letter: 'a'
      }
    }, {
      parse: true,
      collection: new Backbone.Collection(),
      configModel: {}
    });
    spyOn(this.layerDefModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a2);

    this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefModel.collection,
      tablesCollection: new Backbone.Collection()
    });

    this.collection = new AnalysisFormsCollection(null, {
      layerDefinitionModel: this.layerDefModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    });
  });

  describe('.resetByLayerDefinition', function () {
    beforeEach(function () {
      this.collection.resetByLayerDefinition();
    });

    it('should have created a form model for each node (excluding the source)', function () {
      expect(this.collection.pluck('id')).toEqual(['a2', 'a1']);
    });

    it('should have same attributes as the node models they represent', function () {
      expect(this.collection.get('a1').attributes).toEqual(jasmine.objectContaining(this.a1.attributes));
      expect(this.collection.get('a2').attributes).toEqual(jasmine.objectContaining(this.a2.attributes));
    });
  });

  describe('.createHead', function () {
    beforeEach(function () {
      this.collection.addHead({id: 'a3'});
    });

    it('should prepend new form model', function () {
      expect(this.collection.first().id).toEqual('a3');
    });
  });

  describe('.deleteNode', function () {
    describe('when given id represents an persisted node', function () {
      beforeEach(function () {
        spyOn(this.a2, 'destroy');
        this.collection.deleteNode('a2');
      });

      it('should destroy the node-definition for given id', function () {
        expect(this.a2.destroy).toHaveBeenCalled();
      });
    });

    describe('when given id is for a new form model', function () {
      beforeEach(function () {
        this.collection.add({id: 'a3'}, {at: 0});
        this.collection.deleteNode('a3');
      });

      it('should just remove the form model from the collection', function () {
        expect(this.collection.get('a3')).toBeUndefined();
      });
    });
  });

  describe('for a form model', function () {
    beforeEach(function () {
      this.nodeDefModel = this.analysisDefinitionNodesCollection.add({
        id: 'a1'
      });
      this.model = this.collection.add({
        id: 'a1',
        type: 'buffer',
        radius: 100
      });
    });

    describe('.save', function () {
      beforeEach(function () {
        spyOn(this.layerDefModel, 'createNewAnalysisNode');
      });

      describe('when form model represents an existing node', function () {
        beforeEach(function () {
          this.model.set('id', 'a1');
          this.model.save(this.analysisDefinitionNodesCollection);
        });

        it('should update node-def', function () {
          expect(this.nodeDefModel.attributes).toEqual(this.model.attributes);
        });
      });

      describe('when form model represents a new node', function () {
        beforeEach(function () {
          this.model.set('id', 'a3');
          this.model.save(this.analysisDefinitionNodesCollection);
        });

        it('should create a new node', function () {
          expect(this.layerDefModel.createNewAnalysisNode).toHaveBeenCalledWith(this.model.attributes);
        });
      });
    });
  });
});
