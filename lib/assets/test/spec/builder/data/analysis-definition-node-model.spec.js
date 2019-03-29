var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('builder/data/analysis-definition-node-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {}
    });

    this.a0raw = {
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM bar'
      },
      options: {
        table_name: 'bar',
        test: 'hello'
      }
    };

    this.collection.add([
      {
        id: 'a1',
        type: 'trade-area',
        params: {
          source: this.a0raw,
          kind: 'walk',
          time: 300,
          dissolved: true,
          isolines: 3
        },
        options: {
          optional: 'goes separately'
        }
      }, {
        id: 'b1',
        type: 'intersection',
        params: {
          source: this.a0raw,
          target: {
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
          primary_source_name: 'target'
        }
      }, {
        id: 'c1',
        type: 'deprecated-sql-function',
        params: {
          function_name: 'DEP_EXT_buffer',
          primary_source: this.a0raw
        }
      }, {
        id: 'd1',
        type: 'deprecated-sql-function',
        params: {
          function_name: 'DEP_EXT_spatialinterpolation',
          primary_source: this.a0raw,
          secondary_source: this.a0raw
        }
      }
    ]);

    expect(this.collection.pluck('id')).toEqual(['a0', 'b0', 'a1', 'b1', 'c1', 'd1'], 'should have created individual nodes');
    this.a0 = this.collection.get('a0');
    this.b0 = this.collection.get('b0');
    this.a1 = this.collection.get('a1');
    this.b1 = this.collection.get('b1');
    this.c1 = this.collection.get('c1');
    this.d1 = this.collection.get('d1');
  });

  it('should init properly', function () {
    this.collection.each(function (model) {
      expect(model.queryGeometryModel).toBeDefined();
      expect(model.querySchemaModel).toBeDefined();
      expect(model.queryRowsCollection).toBeDefined();
    });
  });

  it('should not have any geom from start', function () {
    expect(this.a0.queryGeometryModel.get('simple_geom')).toBeFalsy();
  });

  it('should keep a flat, denormalized attrs structure internally', function () {
    expect(this.a0.attributes).toEqual({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM bar',
      table_name: 'bar',
      test: 'hello',
      status: 'ready'
    });
    expect(this.a1.attributes).toEqual({
      id: 'a1',
      type: 'trade-area',
      source: 'a0',
      kind: 'walk',
      time: 300,
      dissolved: true,
      isolines: 3,
      optional: 'goes separately'
    });
    expect(this.b1.attributes).toEqual({
      id: 'b1',
      type: 'intersection',
      source: 'a0',
      target: 'b0',
      primary_source_name: 'target'
    });
  });

  describe('.sourceIds', function () {
    it('should return source ids if there are any', function () {
      expect(this.a0.sourceIds()).toEqual([], 'a source node should not have any sources');
      expect(this.a1.sourceIds()).toEqual(['a0']);
      expect(this.b1.sourceIds()).toEqual(['a0', 'b0']);
    });
  });

  describe('.hasPrimarySource', function () {
    it('should return true if it has a primary source', function () {
      expect(this.a0.hasPrimarySource()).toBe(false, 'a source node should not have any sources');
      expect(this.a1.hasPrimarySource()).toBe(true, 'a trade-area should have a single, primary source');
      expect(this.b1.hasPrimarySource()).toBe(true);
    });
  });

  describe('.getPrimarySource', function () {
    it('should return the primary source if it has any', function () {
      expect(this.a0.getPrimarySource()).toBeUndefined('a source node should not have any sources');
      expect(this.a1.getPrimarySource().id).toEqual('a0');
      expect(this.b1.getPrimarySource().id).toEqual('b0');
    });
  });

  describe('.hasSecondarySource', function () {
    it('should return true if it has a secondary source', function () {
      expect(this.a0.hasSecondarySource()).toBe(false, 'a source node should not have any sources');
      expect(this.a1.hasSecondarySource()).toBe(false);
      expect(this.b1.hasSecondarySource()).toBe(true, 'should be target');
    });
  });

  describe('.getSecondarySource', function () {
    it('should return the secondary source if it has any', function () {
      expect(this.a0.getSecondarySource()).toBeUndefined('a source node should not have any sources');
      expect(this.a1.getSecondarySource()).toBeUndefined();
      expect(this.b1.getSecondarySource().id).toEqual('a0');
    });
  });

  describe('.changeSourceIds', function () {
    it('should change the source ids that matches the current id', function () {
      this.a1.changeSourceIds('a0', 'c1');
      expect(this.a1.sourceIds()).toEqual(['c1']);

      this.b1.changeSourceIds('b0', 'c1');
      expect(this.b1.sourceIds()).toEqual(['a0', 'c1']);

      this.b1.changeSourceIds('a0', 'd1');
      expect(this.b1.sourceIds()).toEqual(['d1', 'c1']);
    });

    it('should do nothing if given current id does not match any source', function () {
      this.a1.changeSourceIds('x9', 'c1');
      expect(this.a1.sourceIds()).toEqual(['a0']);
    });
  });

  describe('.destroy', function () {
    it('should destroy the query schema model', function () {
      var querySchemaModel = this.a0.querySchemaModel;
      spyOn(querySchemaModel, 'destroy');
      this.a0.destroy();
      expect(this.collection.pluck('id')).not.toContain('a0');
      expect(querySchemaModel.destroy).toHaveBeenCalled();
      expect(this.a0.querySchemaModel).toBeNull();

      querySchemaModel = this.a1.querySchemaModel;
      spyOn(querySchemaModel, 'destroy');
      this.a1.destroy();
      expect(this.collection.pluck('id')).not.toContain('a1');
      expect(querySchemaModel.destroy).toHaveBeenCalled();
      expect(this.a1.querySchemaModel).toBeNull();

      querySchemaModel = this.b1.querySchemaModel;
      spyOn(querySchemaModel, 'destroy');
      this.b1.destroy();
      expect(this.collection.pluck('id')).not.toContain('b1');
      expect(querySchemaModel.destroy).toHaveBeenCalled();
      expect(this.b1.querySchemaModel).toBeNull();
    });
  });

  describe('.toJSON', function () {
    it('should serialize the model', function () {
      expect(this.a0.toJSON()).toEqual(this.a0raw);

      expect(this.a1.toJSON()).toEqual(
        jasmine.objectContaining({
          id: 'a1',
          type: 'trade-area',
          params: jasmine.any(Object),
          options: {
            optional: 'goes separately'
          }
        }));
      expect(this.a1.toJSON()).toEqual(
        jasmine.objectContaining({
          params: {
            source: this.a0raw,
            kind: 'walk',
            time: 300,
            dissolved: true,
            isolines: 3
          }
        }));

      expect(this.b1.toJSON()).toEqual(
        jasmine.objectContaining({
          id: 'b1',
          type: 'intersection',
          params: jasmine.any(Object),
          options: {
            primary_source_name: 'target'
          }
        }));
      expect(this.b1.toJSON()).toEqual(
        jasmine.objectContaining({
          params: {
            source: this.a0raw,
            source_columns: undefined,
            target: {
              id: 'b0',
              type: 'source',
              params: {
                query: 'SELECT * FROM my_polygons'
              },
              options: {
                table_name: 'my_polygons'
              }
            }
          }
        }));
      expect(this.c1.toJSON().params.function_name).toEqual('DEP_EXT_buffer');
      expect(this.c1.toJSON().params.function_args).not.toBeDefined();
      expect(this.c1.toJSON().params.primary_source).toBeDefined();
      expect(this.c1.toJSON().params.secondary_source).not.toBeDefined();

      expect(this.d1.toJSON().params.function_name).toEqual('DEP_EXT_spatialinterpolation');
      expect(this.d1.toJSON().params.function_args).not.toBeDefined();
      expect(this.d1.toJSON().params.primary_source).toBeDefined();
      expect(this.d1.toJSON().params.secondary_source).toBeDefined();
    });

    describe('when skipOptions is set', function () {
      beforeEach(function () {
        this.options = {skipOptions: true};
      });

      it('should skip options if skipOptions is set to true', function () {
        var a0WithoutOptions = _.omit(this.a0raw, 'options');
        expect(this.a0.toJSON(this.options)).toEqual(a0WithoutOptions);

        expect(this.a1.toJSON(this.options)).toEqual({
          id: 'a1',
          type: 'trade-area',
          params: {
            source: a0WithoutOptions,
            kind: 'walk',
            time: 300,
            dissolved: true,
            isolines: 3
          }
        });

        expect(this.b1.toJSON(this.options)).toEqual(
          jasmine.objectContaining({
            id: 'b1',
            type: 'intersection',
            params: jasmine.any(Object)
          }));
        expect(this.b1.toJSON(this.options)).toEqual(
          jasmine.objectContaining({
            params: {
              source: a0WithoutOptions,
              source_columns: undefined,
              target: {
                id: 'b0',
                type: 'source',
                params: {
                  query: 'SELECT * FROM my_polygons'
                }
              }
            }
          }));
      });
    });
  });

  describe('.containsNode', function () {
    it('should return true if given node is contained inside the analysis', function () {
      expect(this.a0.containsNode(this.b1)).toBe(false, 'source should not contain any node, you fool!');

      expect(this.a1.containsNode(this.a0)).toBe(true);
      expect(this.a1.containsNode(this.b0)).toBe(false, 'should only contain a0');

      expect(this.b1.containsNode(this.a0)).toBe(true);
      expect(this.b1.containsNode(this.b0)).toBe(true);
      expect(this.b1.containsNode(this.a1)).toBe(false);
    });
  });

  describe('.isValidAsInputForType', function () {
    describe('when geometry output is unknown', function () {
      it('should return false', function () {
        expect(this.a0.isValidAsInputForType('buffer')).toBe(null);
        expect(this.a0.isValidAsInputForType('intersection')).toBe(null);

        expect(this.a1.isValidAsInputForType('trade-area')).toBe(null);
        expect(this.a1.isValidAsInputForType('buffer')).toBe(null);

        expect(this.b1.isValidAsInputForType('buffer')).toBe(null);
        expect(this.b1.isValidAsInputForType('trade-area')).toBe(null);
      });
    });

    describe('when geometry output is known', function () {
      it('should return true if is valid as input type', function () {
        expect(this.a0.isValidAsInputForType('source')).toBe(false, 'a source node should not accept any input');

        this.a0.queryGeometryModel.set('simple_geom', 'point');
        expect(this.a0.isValidAsInputForType('trade-area')).toBe(true);
        expect(this.a0.isValidAsInputForType('buffer')).toBe(true);

        this.a0.queryGeometryModel.set('simple_geom', 'polygon');
        expect(this.a0.isValidAsInputForType('trade-area')).toBe(false, 'trade-area only accepts points (unless the camshaft reference changed?)');
        expect(this.a0.isValidAsInputForType('buffer')).toBe(true);
      });
    });
  });

  describe('.clone', function () {
    var a0;

    beforeEach(function () {
      a0 = this.a0;
    });

    it('should throw error in bad input', function () {
      expect(function () { a0.clone(); }).toThrowError(/required/);
      expect(function () { a0.clone(null); }).toThrowError(/required/);
      expect(function () { a0.clone(undefined); }).toThrowError(/required/);
      expect(function () { a0.clone(true); }).toThrowError(/required/);
      expect(function () { a0.clone({}); }).toThrowError(/required/);
    });

    it('should require a new id', function () {
      expect(function () { a0.clone('a0'); }).toThrowError(/different/);
    });

    it('should create a new node with same params but new id', function () {
      var m = a0.clone('g0');
      expect(m).toBeDefined();
      expect(m.id).toEqual('g0');
      expect(m.get('type')).toEqual('source');
      expect(m.get('query')).toEqual(jasmine.any(String));
      expect(m.get('table_name')).toEqual(jasmine.any(String));
      expect(m.get('test')).toEqual('hello');
    });

    it('should add the cloned item to the collection', function () {
      var m = a0.clone('g0');
      expect(this.collection.contains(m)).toBe(true);
    });
  });

  describe('.linkedListBySameLetter', function () {
    var a0;

    beforeEach(function () {
      a0 = this.a0;
    });

    describe('when given a source node', function () {
      beforeEach(function () {
        this.list = a0.linkedListBySameLetter();
      });

      it('should return a list with only the source', function () {
        expect(_.pluck(this.list, 'id')).toEqual(['a0']);
      });
    });

    describe('when called on a node which sources all belong to same letter', function () {
      beforeEach(function () {
        this.a2 = this.collection.add({
          id: 'a2',
          type: 'buffer',
          params: {
            source: this.a1.toJSON(),
            radius: 100
          }
        });

        this.list = this.a2.linkedListBySameLetter();
      });

      it('should return list with all nodes', function () {
        expect(_.pluck(this.list, 'id')).toEqual(['a2', 'a1', 'a0']);
      });
    });

    describe('when given a node which sub-tree belongs to other letter', function () {
      beforeEach(function () {
        this.c2 = this.collection.add({
          id: 'c2',
          type: 'buffer',
          params: {
            radius: 20,
            source: {
              id: 'c1',
              type: 'buffer',
              params: {
                radius: 10,
                source: this.b1.toJSON()
              }
            }
          }
        });

        this.list = this.c2.linkedListBySameLetter();
      });

      it('should return list with all nodes', function () {
        expect(_.pluck(this.list, 'id')).toEqual(['c2', 'c1']);
      });
    });
  });

  describe('.letter', function () {
    it('should return the letter representation ', function () {
      expect(this.a0.letter()).toEqual('a');
      expect(this.b1.letter()).toEqual('b');
    });
  });

  describe('.canBeDeletedByUser', function () {
    it('should return true if it has a source node', function () {
      expect(this.b1.canBeDeletedByUser()).toBe(true);
      expect(this.a0.canBeDeletedByUser()).toBe(false);
      expect(this.b0.canBeDeletedByUser()).toBe(false);
    });
  });

  describe('when given a geom from start', function () {
    beforeEach(function () {
      this.model = this.collection.add({
        id: 'x0',
        type: 'buffer',
        params: {},
        options: {
          simple_geom: 'point'
        }
      });
    });

    it('should set the geom on the query-schema-model', function () {
      expect(this.model.queryGeometryModel.get('simple_geom')).toEqual('point');
    });
  });
});
