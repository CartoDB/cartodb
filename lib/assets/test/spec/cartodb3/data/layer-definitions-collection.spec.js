var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
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

  describe('when there are some layers', function () {
    beforeEach(function () {
      this.collection.reset([{
        id: 'l-0',
        options: {
          type: 'Tiled',
          name: 'Basemap'
        }
      }, {
        id: 'l-1',
        options: {
          type: 'CartoDB',
          table_name: 'foobar'
        }
      }, {
        id: 'l-2',
        options: {
          type: 'CartoDB',
          table_name: 'foobar',
          query: 'SELECT * FROM foobar limit 10'
        }
      }]);
      this.l0 = this.collection.get('l-0');
      this.l1 = this.collection.get('l-1');
      this.l2 = this.collection.get('l-2');
    });

    it('should have created analysis nodes for the data layers', function () {
      expect(this.analysisDefinitionsCollection.length).toEqual(2);

      expect(this.l1.get('source')).toEqual('a0');
      expect(this.analysisDefinitionsCollection.first().id).toEqual('a0');

      expect(this.l2.get('source')).toEqual('b0');
      expect(this.analysisDefinitionsCollection.last().id).toEqual('b0');
    });

    describe('when an analysis head is added on top of 2nd layer', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.add({
          type: 'trade-area',
          params: {
            source: this.analysisDefinitionsCollection.get(this.l2.get('source')).toJSON(),
            kind: 'bike',
            time: 123
          }
        });
        this.l2.set('source', this.analysisDefinitionsCollection.last().id);
      });

      it('should reference the new head', function () {
        // For now done manually, but make sure the id is what we'd expected
        expect(this.l2.get('source')).toEqual('b1');
      });

      describe('when new analysis head is removed', function () {
        beforeEach(function () {
          this.analysisDefinitionsCollection.last().destroy();
        });

        it('should set the source of the removed analysis as the new source for layer', function () {
          expect(this.l2.get('source')).toEqual('b0');
        });

        it('should not affect other layers', function () {
          expect(this.l1.get('source')).toEqual('a0');
        });
      });
    });

    describe('when an analysis root is removed', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.last().destroy();
      });

      it('should unset the source', function () {
        expect(this.l2.get('source')).toBeUndefined();
      });

      it('should not affect other layers', function () {
        expect(this.l1.get('source')).toEqual('a0');
      });
    });
  });
});
