var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeSourceModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('data/analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {}
    });

    this.sqlAPI = new cdb.SQL({
      user: 'pepe'
    });
    spyOn(this.sqlAPI, 'describeGeom');

    this.model = new AnalysisDefinitionNodeSourceModel({
      id: 'g0',
      type: 'source',
      params: {
        query: 'SELECT * FROM bar'
      }
    }, {
      parse: true,
      sqlAPI: this.sqlAPI,
      collection: this.collection
    });
    this.collection.add(this.model);
  });

  it('should have no source ids', function () {
    expect(this.model.sourceIds()).toEqual([]);
  });

  describe('.destroy', function () {
    beforeEach(function () {
      expect(this.collection.pluck('id')).toEqual(['g0']);
      this.model.destroy();
    });

    it('should remove the node from the collection', function () {
      expect(this.collection.pluck('id')).toEqual([]);
    });
  });

  describe('.toJSON', function () {
    it('should serialize the model', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'g0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        }
      });
    });
  });

  describe('.getOutputGeometryType', function () {
    beforeEach(function () {
      this.promise = this.model.getOutputGeometryType();
    });

    it('should return a promise', function () {
      expect(this.promise).toBeDefined();
      expect(this.promise.then).toBeDefined();
      expect(this.promise.fail).toBeDefined();
    });

    describe('when resolved', function () {
      beforeEach(function () {
        expect(this.sqlAPI.describeGeom).toHaveBeenCalled();
        this.sqlAPI.describeGeom.calls.argsFor(0)[2](null, {
          simplified_geometry_type: 'point'
        });
      });

      it('should resolve the promise', function (done) {
        this.promise.then(function (val) {
          expect(val).toEqual('point');
          done();
        });
      });
    });
  });

  describe('when an analysis with sources is created', function () {
    beforeEach(function () {
      this.model = new AnalysisDefinitionNodeModel({
        id: 'x1',
        type: 'trade-area',
        params: {
          source: {
            id: 'g0',
            type: 'source',
            params: {
              query: 'SELECT * FROM bar'
            }
          },
          kind: 'walk',
          time: 300
        }
      }, {
        parse: true,
        sqlAPI: {},
        collection: this.collection
      });
    });

    it('should create individual models for source node', function () {
      expect(this.collection.get('g0')).toBeDefined();
    });

    it('should have source ids', function () {
      expect(this.model.sourceIds()).toEqual(['g0']);
    });

    it('should flatten the data for the model', function () {
      expect(this.model.attributes).toEqual({
        id: 'x1',
        type: 'trade-area',
        source_id: 'g0',
        kind: 'walk',
        time: 300
      });
    });

    describe('.toJSON', function () {
      it('should unflatten the data again', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'x1',
          type: 'trade-area',
          params: {
            source: {
              id: 'g0',
              type: 'source',
              params: {
                query: 'SELECT * FROM bar'
              }
            },
            kind: 'walk',
            time: 300
          }
        });
      });
    });

    describe('.getOutputGeometryType', function () {
      beforeEach(function () {
        this.promise = this.model.getOutputGeometryType();
      });

      it('should return a promise', function () {
        expect(this.promise).toBeDefined();
        expect(this.promise.then).toBeDefined();
        expect(this.promise.fail).toBeDefined();
      });

      it('should resolve the promise with output type', function (done) {
        this.promise.then(function (val) {
          expect(val).toEqual('polygon');
          done();
        });
      });
    });
  });
});
