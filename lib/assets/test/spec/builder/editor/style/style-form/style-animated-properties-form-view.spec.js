var Backbone = require('backbone');
var StyleModel = require('builder/editor/style/style-definition-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var StyleAnimatedPropertiesFormView = require('builder/editor/style/style-form/style-properties-form/style-animated-properties-form-view');
var FactoryModals = require('../../../factories/modals');

describe('editor/style/style-form/style-animated-properties-form-view', function () {
  beforeEach(function () {
    this.styleModel = new StyleModel({
      overlap: true
    }, { parse: true });

    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched'
    }, {
      configModel: {}
    });

    this.queryGeometryModel = new QueryGeometryModel({status: 'fetched'}, {configModel: {}});
    this.queryGeometryModel.set('simple_geom', 'point');

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: {},
      mapId: 'map-123',
      stateDefinitionModel: {},
      userModel: {
        featureEnabled: function () { return true; }
      }
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.layerDefinitionModel = new Backbone.Model();

    this.modals = FactoryModals.createModalService();

    spyOn(StyleAnimatedPropertiesFormView.prototype, 'render').and.callThrough();
    this.view = new StyleAnimatedPropertiesFormView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.styleModel,
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: this.modals
    });
    this.view._styleModel.set({type: 'animation'});

    this.view.render();
  });

  it('should initialize properly', function () {
    this.view._animatedFormModel.trigger('changeSchema');

    expect(this.view.render).toHaveBeenCalled();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
