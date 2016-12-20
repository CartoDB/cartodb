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
  });
});
