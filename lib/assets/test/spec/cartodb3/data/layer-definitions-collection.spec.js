var Backbone = require('backbone');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = {};
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      configModel: configModel
    });
    this.collection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      layersCollection: new Backbone.Collection(),
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      mapId: 'm-123'
    });
  });

  it('should create the layer with the next letter representation available', function () {
    // Adds A-D, like if the collection was creatd from scratch
    this.collection.reset([{}, {}, {}, {}], { silent: true });
    expect(this.collection.first().get('letter')).toEqual('a');
    expect(this.collection.at(2).get('letter')).toEqual('c');
    expect(this.collection.last().get('letter')).toEqual('d');

    // Remove C
    this.collection.remove(this.collection.at(2));

    // Add new as C
    this.collection.add({});
    expect(this.collection.last().get('letter')).toEqual('c');

    // Add new as E
    this.collection.add({});
    expect(this.collection.last().get('letter')).toEqual('e');
  });

  it('should create analysis definition when a table_name or query exist', function () {
    this.collection.add({ id: 'l-0' });
    expect(this.analysisDefinitionsCollection.length).toEqual(0);

    this.collection.add({
      id: 'l-1',
      options: {
        table_name: 'foobar'
      }
    });
    expect(this.collection.last().get('source')).toEqual('b0');
    expect(this.analysisDefinitionsCollection.length).toEqual(1);
    expect(this.analysisDefinitionsCollection.last().id).toEqual('b0');

    this.collection.add({
      id: 'l-2',
      options: {
        table_name: 'foobar',
        query: 'SELECT * FROM foobar limit 10'
      }
    });
    expect(this.collection.last().get('source')).toEqual('c0');
    expect(this.analysisDefinitionsCollection.length).toEqual(2);
    expect(this.analysisDefinitionsCollection.last().id).toEqual('c0');
  });
});
