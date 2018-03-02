var Backbone = require('backbone');
var WidgetsFormColumnOptionsFactory = require('builder/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormCategorySchemaModel = require('builder/editor/widgets/widgets-form/schema/widgets-form-category-schema-model');
var FactoryModals = require('../../../../factories/modals');

describe('editor/widgets/widgets-form/schema/widgets-form-category-schema-model', function () {
  beforeEach(function () {
    var querySchemaModel = new Backbone.Model();
    var userModel = {
      featureEnabled: function () {
        return true;
      }
    };

    this.widgetsFormColumnOptionsFactory = new WidgetsFormColumnOptionsFactory(querySchemaModel);
    spyOn(this.widgetsFormColumnOptionsFactory, 'create').and.returnValue([{
      val: 'col',
      label: 'col',
      type: 'number'
    }, {
      val: 'col2',
      label: 'col2',
      type: 'string'
    }]);
    spyOn(this.widgetsFormColumnOptionsFactory, 'unavailableColumnsHelpMessage');

    this.modals = FactoryModals.createModalService();

    this.model = new WidgetsFormCategorySchemaModel({
      type: 'category',
      layer_id: 'l-1',
      column: 'col',
      aggregation: 'count'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory,
      userModel: userModel,
      configModel: {},
      modals: this.modals
    });
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      this.model.updateSchema();
    });

    it('should contain the real columns as options', function () {
      expect(this.model.schema.column.options[0].label).toEqual('col');
    });

    it('should not contain aggregation column if the aggregation is "count"', function () {
      this.model.set({aggregate: {
        attribute: 'col',
        operation: 'avg'
      }});

      expect(this.model.get('aggregation_column')).toBe('col');

      this.model.set({aggregate: {
        operation: 'count'
      }});

      expect(this.model.get('aggregation_column')).toBeUndefined();
    });
  });
});
