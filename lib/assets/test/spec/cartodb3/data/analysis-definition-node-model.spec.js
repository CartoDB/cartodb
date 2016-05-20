var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeSourceModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('data/analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });
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
        configModel: {},
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

      it('should add an query schema model', function () {
        expect(this.model.querySchemaModel).toBeDefined();
        expect(this.model.querySchemaModel.get('query')).toEqual('SELECT * FROM bar');
        expect(this.model.querySchemaModel.get('may_have_rows')).toBe(true);
      });
    });

    it('should have no source ids', function () {
      expect(this.model.sourceIds()).toEqual([]);
    });

    it('should not have any sources', function () {
      expect(this.model.hasPrimarySource()).toBe(false);
      expect(this.model.hasSecondarySource()).toBe(false);
      expect(this.model.getPrimarySource()).toBeUndefined();
      expect(this.model.getSecondarySource()).toBeUndefined();
    });

    describe('.destroy', function () {
      beforeEach(function () {
        this.querySchemaModel = this.model.querySchemaModel;
        spyOn(this.model.querySchemaModel, 'destroy');
        expect(this.collection.pluck('id')).toEqual(['g0']);
        this.model.destroy();
      });

      it('should remove the node from the collection', function () {
        expect(this.collection.pluck('id')).toEqual([]);
      });

      it('should destroy the querySchemaModel', function () {
        expect(this.querySchemaModel.destroy).toHaveBeenCalled();
        expect(this.model.querySchemaModel).toBeNull();
      });
    });

    describe('.toJSON', function () {
      it('should serialize the model', function () {
        this.model.set('test', 'hello');
        expect(this.model.toJSON()).toEqual({
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

      it('should skip optional attributes if skipOptions flag is set', function () {
        expect(this.model.toJSON({skipOptions: true})).toEqual({
          id: 'g0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          }
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
          time: 300,
          dissolved: true,
          isolines: 3
        }
      }, {
        parse: true,
        configModel: {},
        collection: this.collection
      });
      this.collection.add(this.model);
    });

    it('should create individual models for source node', function () {
      expect(this.collection.get('g0')).toBeDefined();
    });

    it('should have source ids', function () {
      expect(this.model.sourceIds()).toEqual(['g0']);
    });

    it('should have a primary source id', function () {
      expect(this.model.hasPrimarySource()).toBe(true);
      expect(this.model.getPrimarySource().id).toEqual('g0');
    });

    it('should not have a secondary source', function () {
      expect(this.model.hasSecondarySource()).toBe(false);
      expect(this.model.getSecondarySource()).toBeUndefined();
    });

    describe('.containsNode', function () {
      beforeEach(function () {
        this.collection.add({
          id: 'c0',
          type: 'source',
          params: {
            query: 'SELECT * FROM other'
          }
        });
      });

      it('should return true for nodes that exist within the chain of the provided node', function () {
        expect(this.model.containsNode(this.collection.get('x1'))).toBe(true);
        expect(this.model.containsNode(this.collection.get('g0'))).toBe(true);

        expect(this.model.containsNode(this.collection.get('c0'))).toBe(false);
        expect(this.model.containsNode(this.collection.get('d0'))).toBe(false);
      });
    });

    it('should flatten the data for the model', function () {
      expect(this.model.attributes).toEqual({
        id: 'x1',
        type: 'trade-area',
        source: 'g0',
        kind: 'walk',
        time: 300,
        dissolved: true,
        isolines: 3
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
              },
              options: {
                table_name: 'bar'
              }
            },
            kind: 'walk',
            time: 300,
            dissolved: true,
            isolines: 3
          }
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
              params: {
                query: 'SELECT * FROM my_points'
              },
              options: {
                table_name: 'my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {
                query: 'SELECT * FROM my_polygons'
              },
              options: {
                table_name: 'my_polygons'
              }
            }
          },
          options: {
            primary_source_name: 'polygons_source'
          }
        }, {
          parse: true,
          configModel: {},
          collection: this.collection
        });
        this.collection.add(this.model);
      });

      it('should create individual models for source node', function () {
        expect(this.collection.get('a0')).toBeDefined();
        expect(this.collection.get('b0')).toBeDefined();
      });

      it('should have source ids', function () {
        expect(this.model.sourceIds()).toEqual(['a0', 'b0']);
      });

      it('should have a primary source', function () {
        expect(this.model.hasPrimarySource()).toBe(true);
        expect(this.model.getPrimarySource().id).toEqual('b0');
      });

      it('should have a secondary source', function () {
        expect(this.model.hasSecondarySource()).toBe(true);
        expect(this.model.getSecondarySource().id).toEqual('a0');
      });

      describe('.containsNode', function () {
        beforeEach(function () {
          this.collection.add({
            id: 'c0',
            type: 'source',
            params: {
              query: 'SELECT * FROM other'
            }
          });
        });

        it('should return true for nodes that exist within the chain of the provided node', function () {
          expect(this.model.containsNode(this.collection.get('x1'))).toBe(true);
          expect(this.model.containsNode(this.collection.get('a0'))).toBe(true);
          expect(this.model.containsNode(this.collection.get('b0'))).toBe(true);

          expect(this.model.containsNode(this.collection.get('c0'))).toBe(false);
          expect(this.model.containsNode(this.collection.get('d0'))).toBe(false);
        });
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
              },
              options: {
                table_name: 'my_points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {
                query: 'SELECT * FROM my_polygons'
              },
              options: {
                table_name: 'my_polygons'
              }
            }
          },
          options: {
            primary_source_name: 'polygons_source'
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
          configModel: {},
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

      it('should have two source ids', function () {
        expect(this.model.sourceIds()).toEqual(['a0', 'b0']);
      });

      it('should have a primary source', function () {
        expect(this.model.hasPrimarySource()).toBe(true);
        expect(this.model.getPrimarySource().id).toEqual('b0');
      });

      it('should have a secondary source', function () {
        expect(this.model.hasSecondarySource()).toBe(true);
        expect(this.model.getSecondarySource().id).toEqual('a0');
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
          },
          options: {
            primary_source_name: 'polygons_source'
          }
        });
      });
    });
  });
});
