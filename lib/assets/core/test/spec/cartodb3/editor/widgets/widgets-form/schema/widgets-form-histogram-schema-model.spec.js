var Backbone = require('backbone');
var WidgetsFormColumnOptionsFactory = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormHistogramSchemaModel = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/schema/widgets-form-histogram-schema-model');

describe('editor/widgets/widgets-form/schema/widgets-form-histogram-schema-model', function () {
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

    this.model = new WidgetsFormHistogramSchemaModel({
      type: 'histogram'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory,
      userModel: userModel,
      configModel: {},
      modals: {}
    });
  });

  describe('.updateSchema', function () {
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
