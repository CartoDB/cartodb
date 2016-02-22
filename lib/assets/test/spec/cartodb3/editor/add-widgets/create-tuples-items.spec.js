var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var createTuplesItems = require('../../../../../javascripts/cartodb3/editor/add-widgets/create-tuples-items');

describe('editor/add-widgets/create-tuples-items', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layersCollection = new Backbone.Collection({
      id: 'l0'
    }, {
      id: 'l1'
    });
    this.LayerDefinitionsCollection = new LayerDefinitionsCollection([
      {
        id: 'l0',
        type: 'tiled'
      }, {
        id: 'l1',
        type: 'cartodb',
        options: {
          table_name: 'foo_table'
        }
      }, {
        id: 'l2',
        type: 'cartodb',
        options: {
          table_name: 'bar_table'
        }
      }
    ], {
      configModel: configModel,
      layersCollection: this.layersCollection,
      mapId: 'm-123'
    });
    var l1 = this.LayerDefinitionsCollection.get('l1');
    l1.layerTableModel.columnsCollection.reset([
      {
        name: 'county_name',
        type: 'string'
      }, {
        name: 'pop_count',
        type: 'number'
      }
    ]);
    var l2 = this.LayerDefinitionsCollection.get('l2');
    l2.layerTableModel.columnsCollection.reset([
      {
        name: 'pop_count',
        type: 'number'
      }
    ]);
    this.tuplesItems = createTuplesItems(this.LayerDefinitionsCollection);
  });

  it('should return an object', function () {
    expect(this.tuplesItems).toEqual(jasmine.any(Object));
  });

  it('should contain an item for each column name+type match', function () {
    expect(this.tuplesItems['county_name-string'].length).toEqual(1);
    expect(this.tuplesItems['pop_count-number'].length).toEqual(2);
  });

  it('should contain a tuple of column+layer definition in each item', function () {
    var tuples = this.tuplesItems['pop_count-number'];
    expect(tuples[0].columnModel).toBeDefined();
    expect(tuples[0].layerDefinitionModel).toBeDefined();

    expect(tuples[0].columnModel.get('name')).toEqual('pop_count');
    expect(tuples[0].layerDefinitionModel.id).toEqual('l1');
  });
});
