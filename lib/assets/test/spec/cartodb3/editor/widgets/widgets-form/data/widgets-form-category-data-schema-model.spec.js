var cdb = require('cartodb.js');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var LayerTableModel = require('../../../../../../../javascripts/cartodb3/data/layer-table-model');
var WidgetDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/widget-definition-model');
var WidgetsFormCategoryDataSchemaModel = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/data/widgets-form-category-data-schema-model');

describe('editor/widgets/widgets-form/data/widgets-form-category-data-schema-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layerTableModel = new LayerTableModel({
      table_name: 'foobar'
    }, {
      configModel: configModel
    });
    spyOn(this.layerTableModel, 'fetch');

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      type: 'category',
      title: 'AVG districts homes',
      layer_id: 'l1',
      options: {
        column: 'areas',
        aggregation: 'count'
      }
    }, {
      configModel: configModel,
      layerDefinitionModel: new cdb.core.Model(),
      dashboardWidgetsService: new cdb.core.Model()
    });
    this.model = new WidgetsFormCategoryDataSchemaModel({}, {
      widgetDefinitionModel: this.widgetDefinitionModel,
      layerTableModel: this.layerTableModel
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
        expect(this.model.schema.column.options[0].label).toContain('loading');
      });
    });

    describe('when table is fetched', function () {
      beforeEach(function () {
        this.layerTableModel.set('fetched', true);
        this.layerTableModel.columnsCollection.reset([{
          id: 'col',
          name: 'col',
          type: 'integer'
        }], { silent: true });
        this.model.updateSchema();
      });

      it('should render the real columns', function () {
        expect(this.model.schema.column.options[0].label).toEqual('col');
      });
    });
  });
});
