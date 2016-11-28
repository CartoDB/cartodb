var $ = require('jquery');
var ModalsServiceModel = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var Notifier = require('../../../../../javascripts/cartodb3/components/notifier/notifier');
var UserActions = require('../../../../../javascripts/cartodb3/data/user-actions');
var LayersView = require('../../../../../javascripts/cartodb3/editor/layers/layers-view');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');

describe('editor/layers/layers-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.stackLayoutModel = new StackLayoutModel(null, {
      stackLayoutItems: []
    });
    this.modals = new ModalsServiceModel();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionsCollection.add({
      id: 'l1',
      kind: 'carto',
      options: {
        table_name: 'foo_bar',
        cartocss: ''
      }
    });

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    spyOn($.prototype, 'sortable').and.callThrough();

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisDefinitionsCollection: {},
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: {}
    });

    this.view = new LayersView({
      configModel: configModel,
      userModel: {},
      editorModel: new EditorModel(),
      userActions: this.userActions,
      analysis: this.analysis,
      modals: this.modals,
      stackLayoutModel: this.stackLayoutModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      stateDefinitionModel: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('should setup layers list as a sortable', function () {
    beforeEach(function () {
      expect($.prototype.sortable).toHaveBeenCalled();
      $.prototype.sortable.calls.reset();

      // setup additional layer for test-cases
      this.layerDefinitionsCollection.at(0).set('order', 0);
      this.layerDefinitionsCollection.add({
        id: 'l2',
        order: 1,
        kind: 'carto',
        options: {
          table_name: 'foo_bar2',
          cartocss: ''
        }
      });
      this.view.render();

      expect($.prototype.sortable).toHaveBeenCalled();
      this.sortableArgs = $.prototype.sortable.calls.argsFor(0)[0];
    });

    it('should set items', function () {
      expect(this.sortableArgs.items).toEqual(jasmine.any(String));
    });

    describe('when a layer is moved', function () {
      beforeEach(function () {
        spyOn(this.userActions, 'moveLayer');
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

        expect(this.userActions.moveLayer).toHaveBeenCalledWith({ from: 1, to: 0 });
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
      });
    });

    describe('when an analyses is dropped on sortable list', function () {
      beforeEach(function () {
        spyOn(this.userActions, 'createLayerForAnalysisNode');
        this.simulateDragNDrop = function () {
          this.$draggedAnalysis = $('<li class="js-analysis">an analysis node</li>');
          this.$draggedAnalysis.data('analysis-node-id', 'a2');
          spyOn(this.$draggedAnalysis, 'remove');
          this.view.$('.js-layers').children().first().after(this.$draggedAnalysis);
          this.sortableArgs.update('event', {item: this.$draggedAnalysis});
        }.bind(this);
      });

      afterEach(function () {
        this.$draggedAnalysis = null;
      });

      describe('when fine', function () {
        beforeEach(function () {
          this.simulateDragNDrop();
        });

        it('should create a new layer', function () {
          expect(this.userActions.createLayerForAnalysisNode).toHaveBeenCalledWith('a2', {at: 1});
        });
      });

      describe('when already reached the max layers limit', function () {
        beforeEach(function () {
          spyOn(Notifier, 'addNotification').and.callThrough();
          var err = new Error('max layers reached');
          err.userMaxLayers = 4;
          this.userActions.createLayerForAnalysisNode.and.throwError(err);
          this.simulateDragNDrop();
        });

        it('should remove dragged element', function () {
          expect(this.$draggedAnalysis.remove).toHaveBeenCalled();
        });

        it('should log notification', function () {
          expect(this.userActions.createLayerForAnalysisNode).toHaveBeenCalledWith('a2', {at: 1});
          expect(Notifier.addNotification).toHaveBeenCalled();
        });
      });
    });
  });
});
