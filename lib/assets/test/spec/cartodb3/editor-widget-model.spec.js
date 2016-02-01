var cdb = require('cartodb-deep-insights.js');
var EditorWidgetModel = require('../../../javascripts/cartodb3/editor-widget-model');

describe('editor-widget-model', function () {

  beforeEach(function() {
    this.model = new EditorWidgetModel({}, {
      _diWidgetModel: new cdb.core.Model()
    });
  });

  describe('initialize', function() {
    it('should try to set reference model when it is created', function () {
      expect(this.model._diWidgetModel).toBeDefined();
    });

    it('should not set reference model when it is not available', function () {
      expect(new EditorWidgetModel()._diWidgetModel).not.toBeDefined();
    });
  });

  describe('setReferenceWidgetModel', function() {
    beforeEach(function() {
      this.modelNoRef = new EditorWidgetModel({},{});
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
