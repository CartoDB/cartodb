var cdb = require('cartodb.js');
var WidgetsFormStyleSchemaModel = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/style/widgets-form-style-schema-model');

describe('editor/widgets/widgets-form/widgets-form-style-schema-model', function () {
  it('should transform sync values to values that the form interprets as expected', function () {
    var model = new WidgetsFormStyleSchemaModel({
      sync_on_bbox_change: false,
      sync_on_data_change: false
    }, { parse: true });
    expect(model.get('sync_on_bbox_change')).toEqual('');
    expect(model.get('sync_on_data_change')).toEqual('');

    model = new WidgetsFormStyleSchemaModel({
      sync_on_bbox_change: true,
      sync_on_data_change: true
    }, { parse: true });
    expect(model.get('sync_on_bbox_change')).toEqual('true');
    expect(model.get('sync_on_data_change')).toEqual('true');
  });

  describe('.updateWidgetDefinitionModel', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new cdb.core.Model();
      spyOn(this.widgetDefinitionModel, 'save');
    });

    it('should set the expected values for the sync values', function () {
      var model = new WidgetsFormStyleSchemaModel();
      model.set({
        sync_on_bbox_change: '',
        sync_on_data_change: ''
      });
      model.updateWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.save).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.save.calls.argsFor(0)[0].sync_on_bbox_change).toBe(false);
      expect(this.widgetDefinitionModel.save.calls.argsFor(0)[0].sync_on_data_change).toBe(false);

      model.set({
        sync_on_bbox_change: 'true',
        sync_on_data_change: 'true'
      });
      this.widgetDefinitionModel.save.calls.reset();
      model.updateWidgetDefinitionModel(this.widgetDefinitionModel);
      expect(this.widgetDefinitionModel.save).toHaveBeenCalled();
      expect(this.widgetDefinitionModel.save.calls.argsFor(0)[0].sync_on_bbox_change).toBe(true);
      expect(this.widgetDefinitionModel.save.calls.argsFor(0)[0].sync_on_data_change).toBe(true);
    });
  });
});
