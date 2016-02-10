var cdb = require('cartodb.js');
var Backbone = require('backbone');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var WidgetsFormCategoryDataSchemaModel = require('../../../../../../javascripts/cartodb3/editor/widgets-form/schemas/data/widgets-form-category-data-schema-model');

describe('editor/widgets-form/schemas/data/widgets-form-category-data-schema-model', function () {
  beforeEach(function () {
    this.tablesCollection = new Backbone.Collection();
    var layerDefModel1 = new LayerDefinitionModel({
      id: 'l1',
      options: {
        layer_name: 'first'
      }
    }, {
      baseUrl: '/',
      tablesCollection: {}
    });
    var layerDefModel2 = new LayerDefinitionModel({
      id: 'l2',
      options: {
        layer_name: 'second'
      }
    }, {
      baseUrl: '/',
      tablesCollection: this.tablesCollection
    });
    this.tableModel1 = new cdb.core.Model();
    this.tableModel1.columnsCollection = new Backbone.Collection();
    this.tableModel2 = new cdb.core.Model();
    this.tableModel2.columnsCollection = new Backbone.Collection();
    spyOn(this.tableModel1, 'fetch');
    spyOn(this.tableModel2, 'fetch');
    spyOn(layerDefModel1, 'getTableModel').and.returnValue(this.tableModel1);
    spyOn(layerDefModel2, 'getTableModel').and.returnValue(this.tableModel2);
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([layerDefModel1, layerDefModel2], {
      baseUrl: '/',
      mapId: 'm-123',
      tablesCollection: this.tablesCollection,
      layersCollection: new Backbone.Collection()
    });

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
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      this.model.updateSchema();
    });

    it('should set the schema object', function () {
      expect(this.model.schema).toEqual(jasmine.any(Object));
    });

    it('should fetch table since it does not have columns data yet and show a unselectable loading option meanwhile', function () {
      expect(this.tableModel1.fetch).toHaveBeenCalled();
      expect(this.model.schema.column.options[0].label).toContain('loading');
    });

    describe('when table is fetched succesfully', function () {
      beforeEach(function () {
        this.tableModel1.set('complete', true);
        this.tableModel1.columnsCollection.reset([{
          id: 'col',
          name: 'col',
          type: 'integer'
        }], { silent: true });
        this.tableModel1.fetch.calls.argsFor(0)[0].success();
      });

      it('should regenerate the schema', function () {
        expect(this.model.schema).toEqual(jasmine.any(Object));
      });

      it('should render the fetched columns', function () {
        expect(this.model.schema.column.options[0].label).toEqual('col');
      });
    });

    describe('when layer is changed', function () {
      beforeEach(function () {
        this.model.set('layer_id', 'l2');
      });

      it('should reset the selected column', function () {
        expect(this.model.get('column')).toBe(null);
        expect(this.model.get('aggregation_column')).toBe(null);
      });

      it('should fetch table since it does not have columns data yet and show a unselectable loading option meanwhile', function () {
        expect(this.tableModel2.fetch).toHaveBeenCalled();
        expect(this.model.schema.column.options[0].label).toContain('loading');
      });

      describe('when table is fetched', function () {
        beforeEach(function () {
          this.tableModel2.set('complete', true);
          this.tableModel2.columnsCollection.reset([{
            id: 'other',
            name: 'other',
            type: 'string'
          }], { silent: true });
          this.tableModel2.fetch.calls.argsFor(0)[0].success();
        });

        it('should render columns from the associated table', function () {
          expect(this.model.schema.column.options[0].label).toEqual('other');
        });
      });
    });
  });
});
