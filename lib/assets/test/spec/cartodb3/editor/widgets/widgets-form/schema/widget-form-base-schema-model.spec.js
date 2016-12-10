var Backbone = require('backbone');
var WidgetsFormBaseSchemaModel = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/schema/widgets-form-base-schema-model');

describe('editor/widgets/widgets-form/schema/widgets-form-base-schema-model', function () {
  it('should transform sync values to values that the form interprets as expected', function () {
    var model = new WidgetsFormBaseSchemaModel({
      sync_on_bbox_change: false
    }, { parse: true });
    expect(model.get('sync_on_bbox_change')).toEqual('');

    model = new WidgetsFormBaseSchemaModel({
      sync_on_bbox_change: true
    }, { parse: true });
    expect(model.get('sync_on_bbox_change')).toEqual('true');
  });

  describe('.changeWidgetDefinitionModel', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new Backbone.Model();
      spyOn(this.widgetDefinitionModel, 'set');
    });

    it('should set the expected values for the sync values', function () {
      var model = new WidgetsFormBaseSchemaModel();
      model.set({
        sync_on_bbox_change: ''
      });
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.set.calls.argsFor(0)[0].sync_on_bbox_change).toBe(false);

      model.set({
        sync_on_bbox_change: 'true'
      });
      this.widgetDefinitionModel.set.calls.reset();
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.set.calls.argsFor(0)[0].sync_on_bbox_change).toBe(true);
    });

    it('should set the expected values for category and autostyle', function () {
      this.widgetDefinitionModel.attributes.type = 'category';
      this.widgetDefinitionModel.attributes.column = 'col';

      var model = new WidgetsFormBaseSchemaModel();
      model.set({
        auto_style_definition: ''
      });
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.set.calls.argsFor(0)[0].auto_style_definition).toBe('');

      model.set({
        auto_style_definition: {}
      });
      this.widgetDefinitionModel.set.calls.reset();
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();

      var payload = this.widgetDefinitionModel.set.calls.argsFor(0)[0].auto_style_definition;

      expect(payload.color.attribute).toBe('col');
      expect(payload.color.quantification).toBe('category');
      expect(payload.color.range.length).toBe(11);
      expect(payload.color.domain).toBeTruthy();
      expect(payload.color.bins).toBeFalsy();
    });

    it('should set the expected values for histogram and autostyle', function () {
      this.widgetDefinitionModel.attributes.type = 'histogram';
      this.widgetDefinitionModel.attributes.column = 'col';

      var model = new WidgetsFormBaseSchemaModel();
      model.set({
        auto_style_definition: ''
      });
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.set.calls.argsFor(0)[0].auto_style_definition).toBe('');

      model.set({
        auto_style_definition: {}
      });
      this.widgetDefinitionModel.set.calls.reset();
      model.changeWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.set).toHaveBeenCalled();

      var payload = this.widgetDefinitionModel.set.calls.argsFor(0)[0].auto_style_definition;

      expect(payload.color.attribute).toBe('col');
      expect(payload.color.quantification).toBe('quantiles');
      expect(payload.color.range.length).toBe(7);
      expect(payload.color.domain).toBeFalsy();
      expect(payload.color.bins).toBe(7);
    });
  });
});
