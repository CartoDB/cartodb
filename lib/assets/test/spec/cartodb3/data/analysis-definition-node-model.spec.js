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
  });

  describe('when model is a source', function () {
    beforeEach(function () {
      this.model = new AnalysisDefinitionNodeSourceModel({
        id: 'g0',
        type: 'source',
        table_name: 'bar',
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

    describe('validation', function () {
      it('should be valid by default', function () {
        expect(this.model.isValid()).toBe(true);
        expect(this.model.validationError).toBeNull();
      });

      it('should be invalid if missing params', function () {
        this.model.unset('query');
        expect(this.model.isValid()).toBe(false);
        expect(this.model.validationError).toEqual({query: jasmine.any(String)});
      });
    });

    it('should have no source ids', function () {
      expect(this.model.sourceIds()).toEqual([]);
    });

    it('should not have any primary node', function () {
      expect(this.model.getPrimarySourceId()).toBeUndefined();
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
        this.model.set('deferred_output_geometry_type', 'asdasd'); // make sure to exclude the deferred object if there is any
        expect(this.model.toJSON()).toEqual({
          id: 'g0',
          type: 'source',
          table_name: 'bar',
          params: {
            query: 'SELECT * FROM bar'
          }
        });
      });
    });

    describe('.fetchOutputGeometryType', function () {
      beforeEach(function () {
        this.promise = this.model.fetchOutputGeometryType();
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
  });

  describe('when an analysis has sources', function () {
    beforeEach(function () {
      this.model = new AnalysisDefinitionNodeModel({
        id: 'x1',
        type: 'trade-area',
        params: {
          source: {
            id: 'g0',
            type: 'source',
            table_name: 'bar',
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

    it('should have a primary source id', function () {
      expect(this.model.getPrimarySourceId()).toEqual('g0');
    });

    it('should flatten the data for the model', function () {
      expect(this.model.attributes).toEqual({
        id: 'x1',
        type: 'trade-area',
        source: 'g0',
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
              table_name: 'bar',
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

    describe('.fetchOutputGeometryType', function () {
      beforeEach(function () {
        this.promise = this.model.fetchOutputGeometryType();
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

  describe('when a node has multiple sources', function () {
    describe('when model is complete', function () {
      beforeEach(function () {
        this.model = new AnalysisDefinitionNodeModel({
          id: 'x1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              table_name: 'my_points',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              table_name: 'my_polygons',
              params: {
                query: 'SELECT * FROM my_polygons'
              }
            }
          }
        }, {
          parse: true,
          sqlAPI: {},
          collection: this.collection
        });
      });

      it('should create individual models for source node', function () {
        expect(this.collection.get('a0')).toBeDefined();
        expect(this.collection.get('b0')).toBeDefined();
      });

      it('should have source ids', function () {
        expect(this.model.sourceIds()).toEqual(['a0', 'b0']);
      });

      it('should have a primary source id', function () {
        expect(this.model.getPrimarySourceId()).toEqual('b0');
      });

      it('should flatten the data for the model', function () {
        expect(this.model.attributes).toEqual({
          id: 'x1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          points_source: 'a0',
          polygons_source: 'b0'
        });
      });

      it('should be considered valid', function () {
        expect(this.model.isValid()).toBe(true);
        expect(this.model.validationError).toBeNull();
      });

      it('should unflatten the data', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'x1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              table_name: 'my_points',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              table_name: 'my_polygons',
              params: {
                query: 'SELECT * FROM my_polygons'
              }
            }
          }
        });
      });
    });

    describe('when a source (polygons_source) is incomplete', function () {
      beforeEach(function () {
        this.model = new AnalysisDefinitionNodeModel({
          id: 'x1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              table_name: 'my_points',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {
              }
            }
          }
        }, {
          parse: true,
          sqlAPI: {},
          collection: this.collection
        });
      });

      it('should be invalid', function () {
        expect(this.model.isValid()).toBe(false);
        expect(this.model.validationError).toEqual({polygons_source: jasmine.any(String)});
      });

      it('should create the two source nodes', function () {
        expect(this.collection.get('a0')).toBeDefined();
        expect(this.collection.get('b0')).toBeDefined();
      });

      it('should have two sourcei ds', function () {
        expect(this.model.sourceIds()).toEqual(['a0', 'b0']);
      });

      it('should have a primary source id', function () {
        expect(this.model.getPrimarySourceId()).toEqual('b0');
      });

      it('should unflatten what it can for toJSON', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'x1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              table_name: 'my_points',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {
                query: undefined
              }
            }
          }
        });
      });
    });
  });
});
