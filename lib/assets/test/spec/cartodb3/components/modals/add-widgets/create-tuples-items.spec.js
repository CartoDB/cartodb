var _ = require('underscore');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var createTuplesItems = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/create-tuples-items');

describe('components/modals/add-widgets/create-tuples-items', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM table_name'
    });
    analysisDefinitionNodesCollection.add({
      id: 'b0',
      type: 'source',
      query: 'SELECT * FROM table_name_two'
    });
    analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'buffer',
      radio: 300,
      source: 'a0'
    });
    analysisDefinitionNodesCollection.add({
      id: 'b1',
      type: 'buffer',
      radio: 300,
      source: 'a1'
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      {
        id: 'l0',
        options: {
          type: 'Tiled'
        }
      }, {
        id: 'l1',
        options: {
          type: 'CartoDB',
          table_name: 'foo_table'
        }
      }, {
        id: 'l2',
        options: {
          type: 'CartoDB',
          table_name: 'bar_table'
        }
      }
    ], {
      configModel: configModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });

    var a1 = analysisDefinitionNodesCollection.get('a1');
    a1.querySchemaModel.columnsCollection.reset([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'county_name',
        type: 'string'
      }, {
        name: 'the_geom',
        type: 'geom'
      }, {
        name: 'the_geom_webmercator',
        type: 'geom'
      }, {
        name: 'pop_count',
        type: 'number'
      }, {
        name: 'created_at',
        type: 'date'
      }, {
        name: 'updated_at',
        type: 'date'
      }
    ]);
    var b1 = analysisDefinitionNodesCollection.get('b1');
    b1.querySchemaModel.columnsCollection.reset([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'pop_count',
        type: 'number'
      }
    ]);
    this.tuplesItems = createTuplesItems(analysisDefinitionNodesCollection, this.layerDefinitionsCollection);
  });

  it('should return an object', function () {
    expect(this.tuplesItems).toEqual(jasmine.any(Object));
  });

  it('should contain an item for each column name+type match', function () {
    expect(this.tuplesItems['county_name-string'].length).toEqual(1);
    expect(this.tuplesItems['pop_count-number'].length).toEqual(2);
  });

  it('should not add items for blacklisted columns', function () {
    var keys = _.keys(this.tuplesItems).toString();
    expect(keys).not.toContain('the_geom');
    expect(keys).not.toContain('the_geom_webmercator');
    expect(keys).not.toContain('created_at');
    expect(keys).not.toContain('updated_at');
  });

  it('should contain a tuple of column+layer definition in each item', function () {
    var tuples = this.tuplesItems['pop_count-number'];
    expect(tuples[1].layerDefinitionModel).toBeDefined();

    expect(tuples[0].columnModel).toBeDefined();
    expect(tuples[0].columnModel.get('name')).toEqual('pop_count');
    expect(tuples[0].layerDefinitionModel.id).toEqual('l0');

    expect(tuples[1].columnModel).toBeDefined();
    expect(tuples[1].columnModel.get('name')).toEqual('pop_count');
    expect(tuples[1].layerDefinitionModel.id).toEqual('l1');
  });
});
