var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeSourceModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('data/analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      analysisCollection: []
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

    it('should return the letter of the source', function () {
      expect(this.model.getLetter()).toEqual('g');
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
        expect(this.model.toJSON()).toEqual({
          id: 'g0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          }
        });
      });

      it('should include optional attributes if required', function () {
        this.model.set('test', 'hello');
        expect(this.model.toJSONWithOptions(true)).toEqual({
          id: 'g0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          },
          options: {
            table_name: 'bar',
            test: 'hello'
          }
        });
      });
    });

    describe('.asyncGetOutputGeometryType', function () {
      beforeEach(function () {
        this.callbackSpy = jasmine.createSpy('cb');
        this.model.asyncGetOutputGeometryType(this.callbackSpy);
      });

      it('should not call callback immediately', function () {
        expect(this.callbackSpy).not.toHaveBeenCalled();
      });

      describe('when request returns with expected data', function () {
        beforeEach(function () {
          expect(this.sqlAPI.describeGeom).toHaveBeenCalled();
          this.sqlAPI.describeGeom.calls.argsFor(0)[2](null, {simplified_geometry_type: 'point'});
        });

        it('should call callback w/o error and with the returned geometry type', function () {
          expect(this.callbackSpy).toHaveBeenCalled();
          expect(this.callbackSpy.calls.argsFor(0)).toEqual([null, 'point']);
        });
      });

      describe('when request returns with unexpected data', function () {
        beforeEach(function () {
          expect(this.sqlAPI.describeGeom).toHaveBeenCalled();
          this.sqlAPI.describeGeom.calls.argsFor(0)[2](null, {});
        });

        it('should call callback with error', function () {
          expect(this.callbackSpy).toHaveBeenCalled();
          expect(this.callbackSpy.calls.argsFor(0)).toEqual([jasmine.any(String)]);
        });

        it('if called multiple times should return same result unless noCache flag is set', function () {
          this.model.asyncGetOutputGeometryType(this.callbackSpy);
          this.model.asyncGetOutputGeometryType(this.callbackSpy);
          this.model.asyncGetOutputGeometryType(this.callbackSpy);
          expect(this.sqlAPI.describeGeom.calls.count()).toEqual(1);

          // Should make new request when noCache is set to true
          this.model.asyncGetOutputGeometryType(this.callbackSpy, {noCache: true});
          expect(this.sqlAPI.describeGeom.calls.count()).toEqual(2);
          // …once resolved should call callback
          this.sqlAPI.describeGeom.calls.argsFor(1)[2](null, {simplified_geometry_type: 'line'});
          expect(this.callbackSpy.calls.argsFor(this.callbackSpy.calls.count() - 1)).toEqual([null, 'line']);
        });
      });

      describe('when request fails', function () {
        beforeEach(function () {
          expect(this.sqlAPI.describeGeom).toHaveBeenCalled();
          this.sqlAPI.describeGeom.calls.argsFor(0)[2]('error!');
        });

        it('should call callback with error', function () {
          expect(this.callbackSpy).toHaveBeenCalled();
          expect(this.callbackSpy.calls.argsFor(0)).toEqual([jasmine.any(String)]);
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

    describe('.asyncGetOutputGeometryType', function () {
      describe('when has a geometry type', function () {
        beforeEach(function () {
          this.callbackSpy = jasmine.createSpy('cb');
          this.model.asyncGetOutputGeometryType(this.callbackSpy);
        });

        it('should call callback with geometry type', function () {
          expect(this.callbackSpy).toHaveBeenCalled();
          expect(this.callbackSpy.calls.argsFor(0)).toEqual([null, 'polygon']);
        });
      });

      describe('when has no geometry output for given type', function () {
        beforeEach(function () {
          this.callbackSpy = jasmine.createSpy('cb');
          this.model.set('type', 'whatever');
          this.model.asyncGetOutputGeometryType(this.callbackSpy);
        });

        it('should call callback with geometry type', function () {
          expect(this.callbackSpy).toHaveBeenCalled();
          expect(this.callbackSpy.calls.argsFor(0)).toEqual([jasmine.any(Object)]);
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
          },
          options: {
            primary_source_name: 'polygons_source'
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
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
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
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              params: {
                query: 'SELECT * FROM my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {}
            }
          },
          options: {
            primary_source_name: 'polygons_source'
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
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
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
