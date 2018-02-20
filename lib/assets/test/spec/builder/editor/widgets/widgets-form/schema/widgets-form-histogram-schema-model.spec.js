var Backbone = require('backbone');
var WidgetsFormColumnOptionsFactory = require('builder/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormHistogramSchemaModel = require('builder/editor/widgets/widgets-form/schema/widgets-form-histogram-schema-model');
var FactoryModals = require('../../../../factories/modals');

describe('editor/widgets/widgets-form/schema/widgets-form-histogram-schema-model', function () {
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

    this.model = new WidgetsFormHistogramSchemaModel({
      type: 'histogram'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory,
      userModel: userModel,
      configModel: {},
      modals: this.modals
    });
  });

  describe('.updateSchema', function () {
    it('column validator is correct', function () {
      // Arrange
      var expectedValidator = {
        type: 'columnType',
        columnsCollection: this.querySchemaModel.columnsCollection,
        columnType: 'number'
      };

      // Act
      this.model.updateSchema();

      // Assert
      expect(this.model.schema.column).toBeDefined();
      expect(this.model.schema.column.validators).toBeDefined();
      expect(this.model.schema.column.validators[0]).toEqual(expectedValidator);
    });

    it('bins validator is correct', function () {
      // Arrange
      var expectedValidator = {
        type: 'interval',
        min: 2,
        max: 30
      };

      // Act
      this.model.updateSchema();

      // Assert
      expect(this.model.schema.bins).toBeDefined();
      expect(this.model.schema.bins.validators).toBeDefined();
      expect(this.model.schema.bins.validators[0]).toEqual('required');
      expect(this.model.schema.bins.validators[1]).toEqual(expectedValidator);
    });
  });
});
