var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ModalsService = require('builder/components/modals/modals-service-model');
var AddAnalysisView = require('builder/components/modals/add-analysis/add-analysis-view');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('editor/layers/layer-content-view/analyses/analyses-service', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        letter: 'a',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.onboardings = new Backbone.Model();
    this.onboardings.create = function () {};
    this.onboardings.destroy = function () {};

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.modals = new ModalsService();

    AnalysesService.init({
      onboardings: this.onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: this.modals,
      userModel: this.userModel,
      configModel: this.configModel
    });

    var model1 = new Backbone.Model({
      createStackView: function (stackLayoutModel) {
        return new CoreView();
      }
    });
    var model2 = new Backbone.Model({
      createStackView: function (stackLayoutModel) {
        return new CoreView();
      }
    });
    var collection = new Backbone.Collection([model1, model2]);
    this._stackLayoutView = new StackLayoutView({
      collection: collection
    });
  });

  describe('.setLayerId', function () {
    it('should set LayerId', function () {
      AnalysesService.setLayerId(this.layerDefinitionModel.get('id'));
      expect(AnalysesService._layerId).toBe('l-1');
    });
  });

  describe('.setStackLayoutView', function () {
    it('should set StackLayoutView', function () {
      AnalysesService.setStackLayoutView(this._stackLayoutView);
      expect(AnalysesService._stackLayoutView).toBe(this._stackLayoutView);
    });
  });

  describe('.generateGeoreferenceAnalysis', function () {
    it('should return a georeference analysis definition', function () {
      this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
        configModel: this.configModel,
        userModel: this.userModel
      });

      this.a0 = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        table_name: 'foo'
      });
      spyOn(this.a0, 'isCustomQueryApplied').and.returnValue(false);

      var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
        configModel: this.configModel,
        userModel: this.userModel,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        mapId: 'm123',
        stateDefinitionModel: {}
      });
      layerDefinitionsCollection.add(this.layerDefinitionModel);

      AnalysesService.init({
        onboardings: this.onboardings,
        layerDefinitionsCollection: layerDefinitionsCollection,
        modals: this.modals,
        userModel: this.userModel,
        configModel: this.configModel
      });

      AnalysesService.setLayerId(this.layerDefinitionModel.get('id'));

      expect(AnalysesService.generateGeoreferenceAnalysis()).toEqual({
        source: 'a0',
        id: 'a1',
        type: 'georeference-long-lat'
      });
    });
  });

  describe('.addAnalysis', function () {
    beforeEach(function () {
      var mockView = new CoreView();
      spyOn(AddAnalysisView.prototype, 'initialize');
      spyOn(AddAnalysisView.prototype, 'render').and.returnValue(mockView);

      spyOn(AnalysesService._modals, 'create');
      spyOn(AnalysesService._modals, 'onDestroyOnce');

      AnalysesService.setLayerId(this.layerDefinitionModel.get('id'));
      AnalysesService.setStackLayoutView(this._stackLayoutView);
      AnalysesService.addAnalysis();
    });

    afterEach(function () {
      AnalysesService._modals.destroy();
    });

    it('should open a modal add-analysis-view', function () {
      expect(AnalysesService._modals.create).toHaveBeenCalled();
    });

    describe('when modal is closed', function () {
      beforeEach(function () {
        AnalysesService.setStackLayoutView(this._stackLayoutView);
        spyOn(AnalysesService._stackLayoutView.model, 'goToStep');

        this.analysisFormAttrs = {id: 'a1', type: 'buffer'};
        var destroyOnceArgs = AnalysesService._modals.onDestroyOnce.calls.argsFor(0);
        destroyOnceArgs[0].call(destroyOnceArgs[1], this.analysisFormAttrs);
      });

      it('should redirect stack to layer-content', function () {
        expect(AnalysesService._stackLayoutView.model.goToStep).toHaveBeenCalledWith(1, this.layerDefinitionModel, 'layer-content', 'analyses', this.analysisFormAttrs);
      });
    });
  });

  describe('.saveNotAppliedAnalysis', function () {
    it('should save the analysis attrs in _notAppliedAnalysis with persisted false', function () {
      AnalysesService.saveNotAppliedAnalysis({ id: 'someAnalysisId' });

      expect(AnalysesService._notAppliedAnalysis).toEqual({ id: 'someAnalysisId', persisted: false });
    });
  });

  describe('.getNotAppliedAnalysis', function () {
    it('should return the value in _notAppliedAnalysis', function () {
      var analysisAttrs = { id: 'whatAnAwesomeAnalysis' };
      AnalysesService._notAppliedAnalysis = analysisAttrs;

      expect(AnalysesService.getNotAppliedAnalysis()).toEqual(analysisAttrs);
    });
  });

  describe('.clearNotAppliedAnalysis', function () {
    it('should set _notAppliedAnalysis to null', function () {
      AnalysesService._notAppliedAnalysis = { id: 'thisExistsForSure' };

      expect(AnalysesService._notAppliedAnalysis).not.toBeNull();

      AnalysesService.clearNotAppliedAnalysis();

      expect(AnalysesService._notAppliedAnalysis).toBeNull();
    });
  });
});
