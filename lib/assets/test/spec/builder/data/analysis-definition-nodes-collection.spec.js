var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var ConfigModel = require('builder/data/config-model');

describe('data/analysis-definition-nodes-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {},
      relatedTableData: [
        {
          name: 'foo',
          privacy: 'PRIVATE'
        }
      ]
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
        },
        options: {
          table_name: 'foo'
        }
      }, {
        id: 'a1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'a0'
      }]);

      this.b0 = this.collection.add({
        id: 'b0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        },
        options: {
          table_name: 'bar'
        }
      });

      this.b1 = this.collection.add({
        id: 'b1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'b0'
      });
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
              },
              options: {
                table_name: 'bar'
              }
            },
            target: {
              id: 'c0',
              type: 'source',
              params: {
                query: 'SELECT * FROM baz'
              },
              options: {
                table_name: 'baz'
              }
            }
          }
        });
      });

      it('should have created a model for the new analysis node and source nodes if not already existing', function () {
        expect(this.collection.pluck('id')).toEqual(['a0', 'a1', 'b0', 'b1', 'c0', 'd1']);
      });
    });

    describe('a table model should be created', function () {
      it('from relatedTableData if available', function () {
        expect(this.collection.get('a0').tableModel.get('name')).toEqual('foo');
        expect(this.collection.get('a0').tableModel.get('privacy')).toEqual('PRIVATE');
      });

      it('as a default model if relatedTableData is not available', function () {
        expect(this.collection.get('b0').tableModel.get('name')).toEqual('bar');
        expect(this.collection.get('b0').tableModel.get('privacy')).toBeUndefined();
      });
    });

    describe('._getNodeOnTop', function () {
      it('should return node on top', function () {
        expect(this.collection._getNodeOnTop()).toBe(this.b1);
      });
    });

    describe('._getTopNodeIndex', function () {
      it('should return node on top index', function () {
        expect(this.collection._getTopNodeIndex()).toEqual(3);
      });
    });

    describe('._isNodeOnTop', function () {
      it('should return true if given node is on top', function () {
        expect(this.collection._isNodeOnTop(this.b0)).toBe(false);
        expect(this.collection._isNodeOnTop(this.b1)).toBe(true);
      });
    });

    describe('._onQueryObjectsUpdated', function () {
      it('should fetch Query Objects if node is on top', function () {
        spyOn(AnalysisDefinitionNodeModel.prototype, 'fetchQueryObjects');

        this.b0.trigger('queryObjectsUpdated', this.b0);
        this.b1.trigger('queryObjectsUpdated', this.b1);

        expect(AnalysisDefinitionNodeModel.prototype.fetchQueryObjects).toHaveBeenCalledTimes(1);
      });
    });
  });
});
