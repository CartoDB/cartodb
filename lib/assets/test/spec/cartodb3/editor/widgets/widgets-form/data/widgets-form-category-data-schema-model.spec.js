var WidgetsFormColumnOptionsFactory = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormCategoryDataSchemaModel = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/data/widgets-form-category-data-schema-model');

describe('editor/widgets/widgets-form/data/widgets-form-category-data-schema-model', function () {
  beforeEach(function () {
    this.widgetsFormColumnOptionsFactory = new WidgetsFormColumnOptionsFactory({});
    spyOn(this.widgetsFormColumnOptionsFactory, 'create').and.returnValue([{
      val: 'col',
      label: 'col'
    }]);
    spyOn(this.widgetsFormColumnOptionsFactory, 'unavailableColumnsHelpMessage');

    this.model = new WidgetsFormCategoryDataSchemaModel({
      type: 'category',
      layer_id: 'l-1',
      column: 'col',
      aggregation: 'count'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory
    });
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      this.model.updateSchema();
    });

    it('should render the real columns', function () {
      expect(this.model.schema.column.options[0].label).toEqual('col');
    });
  });
});
