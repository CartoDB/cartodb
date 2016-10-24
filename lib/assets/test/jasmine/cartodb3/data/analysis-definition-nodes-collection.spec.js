var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('data/analysis-definition-nodes-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
  });

  describe('.createSourceNode', function () {
    describe('when given faulty input', function () {
      it('should throw an error', function () {
        var c = this.collection;
        expect(function () { c.createSourceNode({}); }).toThrowError(/required/);
        expect(function () { c.createSourceNode({id: 'missing table'}); }).toThrowError(/required/);
        expect(function () { c.createSourceNode({tableName: 'missing id'}); }).toThrowError(/required/);
        expect(function () { c.createSourceNode(); }).toThrowError(/required/);
      });
    });

    describe('when given valid input', function () {
      it('should add a new source node', function () {
        var m = this.collection.createSourceNode({id: 'a0', tableName: 'foo'});
        expect(m.attributes).toEqual({
          id: 'a0',
          type: 'source',
          table_name: 'foo',
          query: 'SELECT * FROM foo',
          status: 'ready'
        });

        m = this.collection.createSourceNode({id: 'b0', tableName: '000cd294-b124-4f82-b569-0f7fe41d2db8'});
        expect(m.attributes).toEqual({
          id: 'b0',
          type: 'source',
          table_name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
          query: 'SELECT * FROM "000cd294-b124-4f82-b569-0f7fe41d2db8"',
          status: 'ready'
        });

        m = this.collection.createSourceNode({id: 'c0', tableName: 'bar'});
        expect(m.attributes).toEqual({
          id: 'c0',
          type: 'source',
          table_name: 'bar',
          query: 'SELECT * FROM bar',
          status: 'ready'
        });

        m = this.collection.createSourceNode({id: 'd0', tableName: '000cd294-b124-4f82-b569-0f7fe41d2db8'});
        expect(m.attributes).toEqual({
          id: 'd0',
          type: 'source',
          table_name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
          query: 'SELECT * FROM "000cd294-b124-4f82-b569-0f7fe41d2db8"',
          status: 'ready'
        });
      });

      it('should allow to create source node with custom query', function () {
        var m = this.collection.createSourceNode({id: 'c0', tableName: 'baz', query: 'SELECT the_geom FROM baz LIMIT 10'});
        expect(m.attributes).toEqual({
          id: 'c0',
          type: 'source',
          table_name: 'baz',
          query: 'SELECT the_geom FROM baz LIMIT 10',
          status: 'ready'
        });
      });
    });
  });

  describe('when sources are added', function () {
    beforeEach(function () {
      this.collection.add([{
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo'
        }
      }, {
        id: 'a1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'a0'
      }, {
        id: 'b0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        }
      }, {
        id: 'b1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'b0'
      }]);
    });

    it('should have created a model for each item', function () {
      expect(this.collection.pluck('id')).toEqual(['a0', 'a1', 'b0', 'b1']);
    });

    describe('when adding an analysis that contains references to existing sources', function () {
      beforeEach(function () {
        this.collection.add({
          id: 'd1',
          type: 'intersection',
          params: {
            source: {
              id: 'b0',
              type: 'source',
              params: {
                query: 'SELECT * FROM bar'
              }
            },
            target: {
              id: 'c0',
              type: 'source',
              params: {
                query: 'SELECT * FROM baz'
              }
            }
          }
        });
      });

      it('should have created a model for the new analysis node and source nodes if not already existing', function () {
        expect(this.collection.pluck('id')).toEqual(['a0', 'a1', 'b0', 'b1', 'c0', 'd1']);
      });
    });
  });
});
