var _ = require('underscore');
var createGeometry = require('../../../../javascripts/cartodb3/value-objects/geometry');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
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
        type: 'point-in-polygon',
        params: {
          points_source: this.a0raw,
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
      }
    ]);

    expect(this.collection.pluck('id')).toEqual(['a0', 'b0', 'a1', 'b1'], 'should have created individual nodes');
    this.a0 = this.collection.get('a0');
    this.b0 = this.collection.get('b0');
    this.a1 = this.collection.get('a1');
    this.b1 = this.collection.get('b1');
  });

  it('should keep a flat, denormalized attrs structure internally', function () {
    expect(this.a0.attributes).toEqual({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM bar',
      table_name: 'bar',
      test: 'hello'
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
      type: 'point-in-polygon',
      points_source: 'a0',
      polygons_source: 'b0',
      primary_source_name: 'polygons_source'
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
      expect(this.b1.hasSecondarySource()).toBe(true, 'a point-in-polygon');
    });
  });

  describe('.getSecondarySource', function () {
    it('should return the secondary source if it has any', function () {
      expect(this.a0.getSecondarySource()).toBeUndefined('a source node should not have any sources');
      expect(this.a1.getSecondarySource()).toBeUndefined();
      expect(this.b1.getSecondarySource().id).toEqual('a0');
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
          type: 'point-in-polygon',
          params: jasmine.any(Object),
          options: {
            primary_source_name: 'polygons_source'
          }
        }));
      expect(this.b1.toJSON()).toEqual(
        jasmine.objectContaining({
          params: {
            points_source: this.a0raw,
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
          }
        }));
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
            type: 'point-in-polygon',
            params: jasmine.any(Object)
          }));
        expect(this.b1.toJSON(this.options)).toEqual(
          jasmine.objectContaining({
            params: {
              points_source: a0WithoutOptions,
              polygons_source: {
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
        expect(this.a0.isValidAsInputForType('point-in-polygon')).toBe(null);

        expect(this.a1.isValidAsInputForType('trade-area')).toBe(null);
        expect(this.a1.isValidAsInputForType('buffer')).toBe(null);

        expect(this.b1.isValidAsInputForType('buffer')).toBe(null);
        expect(this.b1.isValidAsInputForType('trade-area')).toBe(null);
      });
    });

    describe('when geometry output is known', function () {
      it('should return true if is valid as input type', function () {
        expect(this.a0.isValidAsInputForType('source')).toBe(false, 'a source node should not accept any input');

        spyOn(this.a0.querySchemaModel, 'getGeometry').and.returnValue(createGeometry.ex('point'));
        expect(this.a0.isValidAsInputForType('trade-area')).toBe(true);
        expect(this.a0.isValidAsInputForType('buffer')).toBe(true);

        this.a0.querySchemaModel.getGeometry.and.returnValue(createGeometry.ex('polygon'));
        expect(this.a0.isValidAsInputForType('trade-area')).toBe(false, 'trade-area only accepts points (unless the camshaft reference changed?)');
        expect(this.a0.isValidAsInputForType('buffer')).toBe(true);
      });
    });
  });
});
