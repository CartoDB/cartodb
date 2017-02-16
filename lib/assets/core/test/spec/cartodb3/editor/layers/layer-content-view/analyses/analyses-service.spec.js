var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var AnalysesService = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var StackLayoutView = require('../../../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-view');
var ModalsService = require('../../../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var AddAnalysisView = require('../../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');

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
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    var onboardings = new Backbone.Model();
    onboardings.create = function () {};
    onboardings.destroy = function () {};

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    var modals = new ModalsService();

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: modals,
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
        expect(AnalysesService._stackLayoutView.model.goToStep).toHaveBeenCalledWith(1, this.layerDefinitionModel, 'layer-content', this.analysisFormAttrs);
      });
    });
  });
});
