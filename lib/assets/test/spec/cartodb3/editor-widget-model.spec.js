var cdb = require('cartodb-deep-insights.js');
var EditorWidgetModel = require('../../../javascripts/cartodb3/editor-widget-model');
var LayerModel = require('../../../javascripts/cartodb3/layer-model');

describe('editor-widget-model', function () {
  beforeEach(function () {
    this.layerModel = new LayerModel();
    this.layerModel.url = function () {
      return '/layers/l-123';
    };
    this.model = new EditorWidgetModel({
      id: 'w-456'
    }, {
      diWidgetModel: new cdb.core.Model(),
      layerModel: this.layerModel
    });
  });

  it('should have a url pointing under layers API endpoint', function () {
    expect(this.model.url()).toEqual('/layers/l-123/widgets/w-456');
  });

  describe('initialize', function () {
    it('should try to set reference model when it is created', function () {
      expect(this.model._diWidgetModel).toBeDefined();
    });

    it('should not set reference model when it is not available', function () {
      expect(new EditorWidgetModel({}, {layerModel: this.layerModel})._diWidgetModel).not.toBeDefined();
    });
  });

  describe('setReferenceWidgetModel', function () {
    beforeEach(function () {
      this.modelNoRef = new EditorWidgetModel({}, {layerModel: this.layerModel});
    });

    it('should set reference model when needed', function () {
      var currentDiWidgetModel = this.modelNoRef._diWidgetModel;
      expect(currentDiWidgetModel).toBeUndefined();
      this.modelNoRef.setReferenceWidgetModel(new cdb.core.Model());
      expect(currentDiWidgetModel !== this.modelNoRef._diWidgetModel).toBeTruthy();
    });

    it('should not set reference model when it is already defined', function () {
      this.modelNoRef.setReferenceWidgetModel(new cdb.core.Model());
      var currentDiWidgetModel = this.modelNoRef._diWidgetModel;
      var newModel = new cdb.core.Model();
      this.modelNoRef.setReferenceWidgetModel(newModel);
      expect(this.modelNoRef._diWidgetModel !== newModel).toBeTruthy();
    });
  });
});
