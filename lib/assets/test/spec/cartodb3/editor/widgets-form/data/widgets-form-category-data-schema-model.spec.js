var cdb = require('cartodb.js');
var Backbone = require('backbone');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');
var WidgetsFormCategoryDataSchemaModel = require('../../../../../../javascripts/cartodb3/editor/widgets-form/data/widgets-form-category-data-schema-model');

describe('editor/widgets-form/data/widgets-form-category-data-schema-model', function () {
  beforeEach(function () {
    this.tablesCollection = new Backbone.Collection();
    this.tableModel = new cdb.core.Model();
    this.tableModel.columnsCollection = new Backbone.Collection();
    spyOn(this.tableModel, 'fetch');

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      type: 'category',
      title: 'AVG districts homes',
      layer_id: 'l1',
      options: {
        column: 'areas',
        aggregation: 'count'
      }
    }, {
      baseUrl: '/u/pepe',
      layerDefinitionModel: new cdb.core.Model(),
      dashboardWidgetsService: new cdb.core.Model()
    });
    this.model = new WidgetsFormCategoryDataSchemaModel({}, {
      widgetDefinitionModel: this.widgetDefinitionModel,
      tableModel: this.tableModel
    });
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      this.model.updateSchema();
    });

    describe('when table is not fetched', function () {
      it('should set the schema object', function () {
        expect(this.model.schema).toEqual(jasmine.any(Object));
      });

      it('should indicate loading', function () {
        expect(this.model.schema['editor.widgets.data.column'].options[0].label).toContain('loading');
      });
    });

    describe('when table is fetched', function () {
      beforeEach(function () {
        this.tableModel.set('fetched', true);
        this.tableModel.columnsCollection.reset([{
          id: 'col',
          name: 'col',
          type: 'integer'
        }], { silent: true });
        this.model.updateSchema();
      });

      it('should render the real columns', function () {
        expect(this.model.schema['editor.widgets.data.column'].options[0].label).toEqual('col');
      });
    });
  });
});
