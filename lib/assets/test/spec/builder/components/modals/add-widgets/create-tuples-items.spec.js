var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var createTuplesItems = require('builder/components/modals/add-widgets/create-tuples-items');

describe('components/modals/add-widgets/create-tuples-items', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM table_name'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'b0',
      type: 'source',
      query: 'SELECT * FROM table_name_two'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'buffer',
      radio: 300,
      source: 'a0'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'b1',
      type: 'buffer',
      radio: 300,
      source: 'a1'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'secondary_source', // created when selecting secondary nodes, so technically orphaned if not used later.
      type: 'source',
      query: 'SELECT * FROM secondary_source'
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      {
        id: 'l0',
        kind: 'tiled'
      }, {
        id: 'l1',
        kind: 'carto',
        options: {
          table_name: 'foo_table'
        }
      }, {
        id: 'l2',
        kind: 'carto',
        options: {
          table_name: 'bar_table'
        }
      }
    ], {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });

    var a1 = this.analysisDefinitionNodesCollection.get('a1');
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

    var b1 = this.analysisDefinitionNodesCollection.get('b1');
    b1.querySchemaModel.columnsCollection.reset([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'pop_count',
        type: 'number'
      }
    ]);

    var secondary = this.analysisDefinitionNodesCollection.get('secondary_source');
    secondary.querySchemaModel.columnsCollection.reset([
      {
        name: 'only_for_secondary',
        type: 'number'
      }
    ]);

    a1.queryGeometryModel.isDone = function () {
      return true;
    };

    a1.queryGeometryModel.set('simple_geom', true);

    b1.queryGeometryModel.isDone = function () {
      return true;
    };

    b1.queryGeometryModel.set('simple_geom', true);

    this.tuplesItems = createTuplesItems(this.analysisDefinitionNodesCollection, this.layerDefinitionsCollection);
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

  it('should not contain a tuple when no geometry data', function () {
    var b1 = this.analysisDefinitionNodesCollection.get('b1');

    b1.queryGeometryModel.isDone = function () {
      return false;
    };

    b1.queryGeometryModel.set('simple_geom', false);

    this.tuplesItems = createTuplesItems(this.analysisDefinitionNodesCollection, this.layerDefinitionsCollection);

    var tuples = this.tuplesItems['pop_count-number'];
    expect(tuples.length).toBe(1);
    expect(tuples[0].layerDefinitionModel.id).toEqual('l1');
  });

  it('should contain a tuple of column+layer definition in each item', function () {
    var tuples = this.tuplesItems['pop_count-number'];

    expect(tuples[0].columnModel).toBeDefined();
    expect(tuples[0].columnModel.get('name')).toEqual('pop_count');
    expect(tuples[0].layerDefinitionModel.id).toEqual('l1');

    expect(tuples[1].columnModel).toBeDefined();
    expect(tuples[1].columnModel.get('name')).toEqual('pop_count');
    expect(tuples[1].layerDefinitionModel.id).toEqual('l2');
  });

  it('should skip nodes that does not have an owning layer', function () {
    for (var columnName in this.tuplesItems) {
      var tuples = this.tuplesItems[columnName];
      tuples.forEach(function (tuple) {
        expect(tuple.columnModel).toBeDefined('a tuple for ' + columnName + ' is missing columnModel');
        expect(tuple.layerDefinitionModel).toBeDefined('a tuple for ' + columnName + ' is missing layerDefinitionModel');
        expect(tuple.analysisDefinitionNodeModel).toBeDefined('a tuple for ' + columnName + ' is missing analysisDefinitionModel');
      }, this);
    }
  });
});
