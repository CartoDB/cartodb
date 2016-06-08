var $ = require('jquery');
var ModalsServiceModel = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayersView = require('../../../../../javascripts/cartodb3/editor/layers/layers-view');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layers-view', function () {
  beforeEach(function () {
    this.stackLayoutModel = new StackLayoutModel(null, {
      stackLayoutItems: []
    });
    this.modals = new ModalsServiceModel();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      basemaps: {}
    });
    this.layerDefinitionsCollection.add({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'foo_bar',
        cartocss: ''
      }
    });

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    spyOn($.prototype, 'sortable').and.callThrough();

    this.view = new LayersView({
      configModel: {},
      userModel: {},
      editorModel: new EditorModel(),
      analysis: this.analysis,
      modals: this.modals,
      stackLayoutModel: this.stackLayoutModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('should setup layers list as a sortable', function () {
    beforeEach(function () {
      expect($.prototype.sortable).toHaveBeenCalled();
      this.sortableArgs = $.prototype.sortable.calls.argsFor(0)[0];
    });

    it('should set items', function () {
      expect(this.sortableArgs.items).toEqual(jasmine.any(String));
    });

    it('should not allow dragging on title', function () {
      expect(this.sortableArgs.cancel).toEqual(jasmine.any(String));
      expect(this.sortableArgs.cancel).toContain('title');
    });

    describe('when sortable is updated', function () {
      beforeEach(function () {
        spyOn(this.layerDefinitionsCollection, 'moveLayer').and.callFake(function () {});

        this.layerDefinitionsCollection.at(0).set('order', 0);
        this.layerDefinitionsCollection.add({
          id: 'l2',
          order: 1,
          options: {
            type: 'CartoDB',
            table_name: 'foo_bar2',
            cartocss: ''
          }
        });

        this.view.render();
      });

      it('should move layers from top to bottom', function () {
        // Simulate drag and drop by moving the layer on top to the bottom
        var layer0 = this.view.$el.find('.js-layer')[0];
        var data = $(layer0).data();
        var element = $(layer0).clone();
        $(layer0).remove();
        this.view.$('.js-layers').append(element);
        element.data(data);

        this.sortableArgs.update('event', { item: element });

        expect(this.layerDefinitionsCollection.moveLayer).toHaveBeenCalledWith({ from: 1, to: 0 });
      });

      it('should move layers from bottom to top', function () {
        // Simulate drag and drop by moving the layer at the bottom to the top
        var layer1 = this.view.$el.find('.js-layer')[1];
        var data = $(layer1).data();
        var element = $(layer1).clone();
        $(layer1).remove();
        this.view.$('.js-layers').prepend(element);
        element.data(data);

        this.sortableArgs.update('event', { item: element });

        expect(this.layerDefinitionsCollection.moveLayer).toHaveBeenCalledWith({ from: 0, to: 1 });
      });
    });
  });
});
