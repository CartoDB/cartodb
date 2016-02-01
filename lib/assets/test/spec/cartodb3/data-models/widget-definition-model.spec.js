var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data-models/layer-definition-model');

describe('widget-defintion-model', function () {
  beforeEach(function () {
    this.layerDefModel = new LayerDefinitionModel();
    this.layerDefModel.url = function () {
      return '/layers/l-123';
    };
    this.widgetDefModel = new WidgetDefinitionModel({
      id: 'w-456'
    }, {
      widgetModel: new cdb.core.Model(),
      layerDefinitionModel: this.layerDefModel
    });
  });

  it('should have a url pointing under layers API endpoint', function () {
    expect(this.widgetDefModel.url()).toEqual('/layers/l-123/widgets/w-456');
  });

  describe('initialize', function () {
    it('should try to set reference model when it is created', function () {
      expect(this.widgetDefModel._widgetModel).toBeDefined();
    });

    it('should not set reference model when it is not available', function () {
      expect(new WidgetDefinitionModel({}, {layerDefinitionModel: this.layerDefModel})._widgetModel).not.toBeDefined();
    });
  });

  describe('setReferenceWidgetModel', function () {
    beforeEach(function () {
      this.widgetDefModelNoRef = new WidgetDefinitionModel({}, {layerDefinitionModel: this.layerDefModel});
    });

    it('should set reference model when needed', function () {
      var currentDiWidgetModel = this.widgetDefModelNoRef._widgetModel;
      expect(currentDiWidgetModel).toBeUndefined();
      this.widgetDefModelNoRef.setReferenceWidgetModel(new cdb.core.Model());
      expect(currentDiWidgetModel).not.toBe(this.widgetDefModelNoRef._widgetModel);
    });

    it('should not set reference model when it is already defined', function () {
      this.widgetDefModelNoRef.setReferenceWidgetModel(new cdb.core.Model());
      var newModel = new cdb.core.Model();
      this.widgetDefModelNoRef.setReferenceWidgetModel(newModel);
      expect(this.widgetDefModelNoRef._widgetModel).not.toBe(newModel);
    });
  });
});
