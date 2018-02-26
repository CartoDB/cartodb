var Backbone = require('backbone');
var WidgetsFormColumnOptionsFactory = require('builder/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormFormulaSchemaModel = require('builder/editor/widgets/widgets-form/schema/widgets-form-formula-schema-model');
var FactoryModals = require('../../../../factories/modals');

describe('editor/widgets/widgets-form/schema/widgets-form-formula-schema-model', function () {
  beforeEach(function () {
    var userModel = {
      featureEnabled: function () {
        return true;
      }
    };

    this.querySchemaModel = new Backbone.Model();
    this.widgetsFormColumnOptionsFactory = new WidgetsFormColumnOptionsFactory(this.querySchemaModel);
    spyOn(this.widgetsFormColumnOptionsFactory, 'create').and.returnValue([{
      val: 'col',
      label: 'col',
      type: 'number'
    }, {
      val: 'col2',
      label: 'col2',
      type: 'string'
    }]);

    this.modals = FactoryModals.createModalService();

    this.model = new WidgetsFormFormulaSchemaModel({
      type: 'formula',
      column: 'cartodb_id',
      operation: 'avg'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory,
      userModel: userModel,
      configModel: {},
      modals: this.modals,
      parse: true
    });
  });

  it('should parse the aggregation correctly', function () {
    var attrs = this.model.toJSON();
    expect(attrs.aggregate.operator).toBe('avg');
    expect(attrs.aggregate.attribute).toBe('cartodb_id');
  });
});
