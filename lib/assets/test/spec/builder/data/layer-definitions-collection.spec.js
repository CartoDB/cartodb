var _ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var UserModel = require('builder/data/user-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var layerColors = require('builder/data/layer-colors');

describe('data/layer-definitions-collection', function () {
  var collection;
  var configModel;
  var userModel;
  var analysisDefinitionNodesCollection;

  var createCollectionFn = function (options) {
    configModel = new ConfigModel({
      user_name: 'pepe',
      base_url: '/u/pepe'
    });

    userModel = new UserModel({}, {
      configModel: configModel
    });

    analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    var defaultOptions = {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    };

    return new LayerDefinitionsCollection(null, _.extend(defaultOptions, options));
  };

  beforeEach(function () {
    collection = createCollectionFn({});
  });

  describe('.add', function () {
    it('should not have created source nodes for layers that have non-sources', function () {
      collection.add({
        id: 'A',
        kind: 'carto',
        options: {
          table_name: 'alice',
          source: 'a1'
        }
      });
      expect(analysisDefinitionNodesCollection.pluck('id')).not.toContain('a0');
    });

    it('should create source if it matches expected source node id', function () {
      collection.add({
        id: 'A',
        kind: 'carto',
        options: {
          table_name: 'alice',
          source: 'a0'
        }
      });
      expect(analysisDefinitionNodesCollection.pluck('id')).toContain('a0');
    });
  });

  it('should create the layer with the next letter representation available but only for data layers', function () {
    // Adds A-D, like if the collection was created from scratch
    var layersData = [
      {kind: 'tiled', order: 0}, // a basemap
      {kind: 'carto', order: 1, options: {letter: 'b'}},
      {kind: 'carto', order: 2},
      {kind: 'carto', order: 3, options: {letter: 'a'}},
      {kind: 'torque', order: 4}
    ];
    collection.resetByLayersData(layersData);
    expect(collection.pluck('letter')).toEqual([undefined, 'b', 'c', 'a', 'd']);

    // Remove C
    collection.remove(collection.findWhere({letter: 'c'}));
    expect(collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd']);

    // Add new as C
    collection.add({kind: 'carto', order: 4});
    expect(collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c']);

    // Add new as E, F, G
    collection.add([
      {kind: 'carto', order: 5},
      {kind: 'carto', order: 6},
      {kind: 'carto', order: 7}
    ]);
    expect(collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c', 'e', 'f', 'g']);

    // Add a new tiled (labels-on-top) layer
    collection.add({kind: 'tiled', order: 8});
    expect(collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c', 'e', 'f', 'g', undefined]);

    // Remove all existing and add a new, should reset letters
    collection.reset([
      {kind: 'tiled'},
      {kind: 'carto'}
    ]);
    expect(collection.pluck('letter')).toEqual([undefined, 'a']);
  });

  it('should create the layer with the color that corresponds to the letter', function () {
    var layersData = [
      { kind: 'tiled', order: 0 }, // a basemap
      { kind: 'carto', order: 1 },
      { kind: 'carto', order: 2 },
      { kind: 'torque', order: 3 }
    ];

    collection.resetByLayersData(layersData);
    expect(collection.pluck('letter')).toEqual([ undefined, 'a', 'b', 'c' ]);
    expect(collection.pluck('color')).toEqual([ undefined, layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2] ]);

    collection.remove(collection.at(0));
    expect(collection.pluck('letter')).toEqual([ 'a', 'b', 'c' ]);
    expect(collection.pluck('color')).toEqual([ layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2] ]);

    collection.add({ kind: 'carto' });
    expect(collection.pluck('letter')).toEqual([ 'a', 'b', 'c', 'd' ]);
    expect(collection.pluck('color')).toEqual([ layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2], layerColors.COLORS[3] ]);

    // Remove all existing and add a couple of new layers
    collection.reset([
      { kind: 'carto' },
      { kind: 'carto' }
    ]);
    expect(collection.pluck('letter')).toEqual([ 'a', 'b' ]);
    expect(collection.pluck('color')).toEqual([layerColors.COLORS[0], layerColors.COLORS[1]]);
  });

  it('should sanitize labels layer when create layers collection', function () {
    var layersData = [
      { kind: 'tiled', order: 0 }, // a basemap
      { kind: 'carto', order: 1 },
      { kind: 'tiled', order: 2 },
      { kind: 'carto', order: 3 },
      { kind: 'tiled', order: 4 }
    ];

    collection.resetByLayersData(layersData);
    expect(collection.length).toEqual(layersData.length - 1);
    expect(collection.filter(function (layer) {
      return layer.get('type') === 'Tiled';
    }).length).toEqual(2);
  });

  it('should create a layer with the owner of the table in the query', function () {
    var layer1 = collection.add({
      kind: 'carto',
      options: {
        table_name: 'table_name',
        user_name: 'paco'
      }
    });

    var sourceNode1 = analysisDefinitionNodesCollection.get(layer1.get('source'));
    expect(layer1.get('sql').toLowerCase()).toBe('select * from paco.table_name');
    expect(sourceNode1.get('query').toLowerCase()).toBe('select * from paco.table_name');

    var layer2 = collection.add({
      kind: 'carto',
      options: {
        table_name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
        user_name: 'paco'
      }
    });

    var sourceNode2 = analysisDefinitionNodesCollection.get(layer2.get('source'));
    expect(layer2.get('sql').toLowerCase()).toBe('select * from paco."000cd294-b124-4f82-b569-0f7fe41d2db8"');
    expect(sourceNode2.get('query').toLowerCase()).toBe('select * from paco."000cd294-b124-4f82-b569-0f7fe41d2db8"');

    var layer3 = collection.add({
      kind: 'carto',
      options: {
        table_name: 'table_name',
        user_name: 'pepe'
      }
    });

    var sourceNode3 = analysisDefinitionNodesCollection.get(layer3.get('source'));
    expect(layer3.get('sql').toLowerCase()).toBe('select * from table_name');
    expect(sourceNode3.get('query').toLowerCase()).toBe('select * from table_name');

    var layer4 = collection.add({
      kind: 'carto',
      options: {
        table_name: 'paco.table_name',
        user_name: ''
      }
    });

    var sourceNode4 = analysisDefinitionNodesCollection.get(layer4.get('source'));
    expect(layer4.get('sql').toLowerCase()).toBe('select * from paco.table_name');
    expect(sourceNode4.get('query').toLowerCase()).toBe('select * from paco.table_name');
  });

  describe('.save', function () {
    beforeEach(function () {
      spyOn(Backbone, 'sync');

      var layer1 = new Backbone.Model({ id: 'layer1', type: 'Tiled' });
      var layer2 = new Backbone.Model({ id: 'layer2', type: 'CartoDB' });
      var layer3 = new Backbone.Model({ id: 'layer3', type: 'CartoDB' });

      collection.reset([
        layer3,
        layer1,
        layer2
      ]);
    });

    it('should order and save the entire collection when all analysis definitions have been created', function () {
      var options = {};
      collection.save(options);
      expect(collection.pluck('id')).toEqual(['layer3', 'layer1', 'layer2']);
      expect(Backbone.sync).toHaveBeenCalledWith('update', collection, options);
    });
  });

  describe('.getNumberOfDataLayers', function () {
    it('should return the number of CartoDB and Torque layers', function () {
      expect(collection.getNumberOfDataLayers()).toEqual(0);

      collection.reset([
        { kind: 'tiled' },
        { kind: 'carto' },
        { kind: 'torque' },
        { kind: 'background' }
      ]);

      expect(collection.getNumberOfDataLayers()).toEqual(2);
    });
  });

  describe('.findPrimaryParentLayerToAnalysisNode', function () {
    beforeEach(function () {
      var b1 = analysisDefinitionNodesCollection.add({ // eslint-disable-line no-unused-vars
        id: 'b1',
        type: 'buffer',
        params: {
          radius: 3,
          source: {
            id: 'a2',
            type: 'buffer',
            params: {
              radius: 2,
              source: {
                id: 'a1',
                type: 'buffer',
                params: {
                  radius: 1,
                  source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                      query: 'SELECT * FROM foobar'
                    }
                  }
                }
              }
            }
          }
        }
      });

      collection.add([
        {
          id: 'A',
          kind: 'carto',
          options: {
            source: 'a2'
          }
        }, {
          id: 'B',
          kind: 'carto',
          options: {
            source: 'b1'
          }
        }
      ]);
    });

    it('should return a parent layer if given node is a direct node below a node in another layer', function () {
      var a2 = analysisDefinitionNodesCollection.get('a2');
      expect(collection.findPrimaryParentLayerToAnalysisNode(a2).id).toEqual('B');
    });

    it('should not return anything if found layer should be excluded', function () {
      var a2 = analysisDefinitionNodesCollection.get('a2');
      var opts = {exclude: collection.get('B')};
      expect(collection.findPrimaryParentLayerToAnalysisNode(a2, opts)).toBeUndefined();

      opts = {exclude: [collection.get('B')]};
      expect(collection.findPrimaryParentLayerToAnalysisNode(a2, opts)).toBeUndefined();
    });

    it('should not return anything if given node has no parent layer immediate above it', function () {
      var a1 = analysisDefinitionNodesCollection.get('a1');
      expect(collection.findPrimaryParentLayerToAnalysisNode(a1)).toBeUndefined();
      var b1 = analysisDefinitionNodesCollection.get('b1');
      expect(collection.findPrimaryParentLayerToAnalysisNode(b1)).toBeUndefined();
    });
  });

  describe('layers position methods', function () {
    beforeEach(function () {
      collection.reset([
        { kind: 'tiled' },
        { kind: 'carto' },
        { kind: 'carto' },
        { kind: 'torque' },
        { kind: 'tiled' }
      ]);
    });

    it('.isDataLayerOnTop', function () {
      expect(collection.isDataLayerOnTop(collection.at(1))).toBeFalsy();
      expect(collection.isDataLayerOnTop(collection.at(2))).toBeFalsy();
      expect(collection.isDataLayerOnTop(collection.at(3))).toBeTruthy();

      // Removing "labels on top" layer
      collection.remove(collection.last());

      expect(collection.isDataLayerOnTop(collection.at(1))).toBeFalsy();
      expect(collection.isDataLayerOnTop(collection.at(2))).toBeFalsy();
      expect(collection.isDataLayerOnTop(collection.at(3))).toBeTruthy();

      // Removing torque layer
      collection.remove(collection.last());

      expect(collection.isDataLayerOnTop(collection.at(1))).toBeFalsy();
      expect(collection.isDataLayerOnTop(collection.at(2))).toBeTruthy();
    });

    it('.getTopDataLayerIndex', function () {
      expect(collection.getTopDataLayerIndex()).toBe(3);

      // Removing "labels on top" layer
      collection.remove(collection.last());

      expect(collection.getTopDataLayerIndex()).toBe(3);
      // Removing torque layer
      collection.remove(collection.last());

      expect(collection.getTopDataLayerIndex()).toBe(2);
    });
  });

  describe('.setBaseLayer', function () {
    var changingBaseLayerCallback;
    var baseLayerChangedCallback;
    var baseLayerFailedCallback;

    beforeEach(function () {
      spyOn(Backbone, 'sync').and.returnValue({
        always: function () {}
      });
      spyOn(Backbone.Model.prototype, 'save').and.callThrough();
      spyOn(Backbone.Model.prototype, 'destroy').and.callThrough();

      changingBaseLayerCallback = jasmine.createSpy('changingBaseLayer');
      baseLayerChangedCallback = jasmine.createSpy('baseLayerChanged');
      baseLayerFailedCallback = jasmine.createSpy('baseLayerFailed');

      collection.on('changingBaseLayer', changingBaseLayerCallback);
      collection.on('baseLayerChanged', baseLayerChangedCallback);
      collection.on('baseLayerFailed', baseLayerFailedCallback);
    });

    describe('when trying to set the same baseLayer', function () {
      beforeEach(function () {
        collection.reset([
          {
            kind: 'tiled',
            options: {
              name: 'Positron',
              category: 'CartoDB'
            }
          }
        ]);
      });

      it('should trigger events', function () {
        var changingBaseLayerCallback = jasmine.createSpy('changingBaseLayer');
        var baseLayerChangedCallback = jasmine.createSpy('baseLayerChanged');
        collection.on('changingBaseLayer', changingBaseLayerCallback);
        collection.on('baseLayerChanged', baseLayerChangedCallback);

        collection.setBaseLayer({ type: 'Tiled', name: 'Positron', category: 'CartoDB' });

        expect(collection.size()).toEqual(1);
        expect(changingBaseLayerCallback).toHaveBeenCalled();
        expect(baseLayerChangedCallback).toHaveBeenCalled();
      });
    });

    it('should unset previous base layer attributes that are not present in the new layer (eg: urlTemplate)', function () {
      Backbone.sync.and.callFake(function (method, model, options) {
        options && options.success({
          id: 'LAYER_ID',
          kind: 'gmapsbase',
          order: 0,
          options: {
            type: 'GMapsBase',
            baseType: 'BASE_TYPE'
          }
        });
        return {
          always: function () {}
        };
      });

      collection.reset([
        {
          id: 'LAYER_ID',
          kind: 'tiled',
          options: {
            type: 'Tiled',
            urlTemplate: 'URL_TEMPLATE'
          }
        }
      ]);
      var baseLayer = collection.at(0);

      expect(baseLayer.attributes).toEqual({ id: 'LAYER_ID', type: 'Tiled', urlTemplate: 'URL_TEMPLATE' });

      collection.setBaseLayer({
        type: 'GMapsBase',
        category: 'GMaps',
        baseType: 'hybrid'
      });

      // Ensure a request to update the object is made
      expect(Backbone.sync).toHaveBeenCalledWith(
        'update',
        jasmine.objectContaining({
          id: 'LAYER_ID'
        }),
        jasmine.objectContaining({ silent: true, wait: true })
      );

      // Attributes no longer contains the urlTemplate attr, which only applies to Tiled layers
      expect(baseLayer.attributes).toEqual({
        id: 'LAYER_ID',
        type: 'GMapsBase',
        autoStyle: false,
        order: 0,
        category: 'GMaps',
        baseType: 'BASE_TYPE'
      });
    });

    describe("when the current baseLayer doesn't have labels", function () {
      beforeEach(function () {
        collection.reset([
          {
            id: '1',
            kind: 'tiled',
            options: {
              name: 'Positron',
              category: 'CartoDB'
            }
          }
        ]);
      });

      describe("when the new baseLayer doesnt't have labels", function () {
        beforeEach(function () {
          collection.setBaseLayer({
            type: 'Tiled',
            name: 'Dark matter',
            category: 'CartoDB'
          });
        });

        it('should trigger a "changingBaseLayer event', function () {
          expect(changingBaseLayerCallback.calls.count()).toEqual(1);
        });

        it('should save the existing base layer', function () {
          expect(Backbone.Model.prototype.save.calls.count()).toEqual(1);
        });

        describe('when the base layer is saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].success({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB'
              }
            });
          });

          it('should update the base layer', function () {
            expect(collection.first().toJSON()).toEqual({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                type: 'Tiled'
              },
              order: 0
            });
          });

          it('should trigger a "baseLayerChanged" event', function () {
            expect(baseLayerChangedCallback.calls.count()).toEqual(1);
          });
        });

        describe('when the base layer is NOT saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].error();
          });

          it('should trigger a "baseLayerFailed" event', function () {
            expect(baseLayerFailedCallback).toHaveBeenCalled();
          });
        });
      });

      describe('when the new baseLayer has labels', function () {
        beforeEach(function () {
          collection.setBaseLayer({
            type: 'Tiled',
            name: 'Dark matter',
            category: 'CartoDB',
            labels: {
              urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
            }
          });
        });

        it('should trigger a "changingBaseLayer event', function () {
          expect(changingBaseLayerCallback.calls.count()).toEqual(1);
        });

        it('should save the existing baseLayer', function () {
          expect(Backbone.Model.prototype.save.calls.count()).toEqual(1);
        });

        describe('when the base layer is saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].success({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                labels: {
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
                }
              }
            });
          });

          it('should update the base layer', function () {
            expect(collection.first().toJSON()).toEqual({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                type: 'Tiled',
                labels: {
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
                }
              },
              order: 0
            });
          });

          describe('when the labels layer is saved', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].success({
                kind: 'tiled',
                options: {
                  name: 'Dark matter Labels',
                  category: 'CartoDB',
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
                },
                order: 1
              });
            });

            it('should trigger a "baseLayerChanged" event', function () {
              expect(baseLayerChangedCallback.calls.count()).toEqual(1);
            });

            it('should create the labels layer', function () {
              expect(collection.last().toJSON()).toEqual({
                kind: 'tiled',
                options: {
                  type: 'Tiled',
                  name: 'Dark matter Labels',
                  category: 'CartoDB',
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
                },
                order: 1
              });
            });

            it('should add the layer to the collection', function () {
              expect(collection.size()).toEqual(2);
            });
          });

          describe('when the labels layer is NOT saved', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].error();
            });

            it('should trigger a "baseLayerFailed" event', function () {
              expect(baseLayerFailedCallback.calls.count()).toEqual(1);
            });

            it('should NOT add the layer to the collection', function () {
              expect(collection.size()).toEqual(1);
            });
          });
        });

        describe('when the base layer is NOT saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].error();
          });

          it('should NOT create the labels layer', function () {
            expect(Backbone.Model.prototype.save.calls.count()).toEqual(1);
            expect(collection.size()).toEqual(1);
          });

          it('should trigger a "baseLayerFailed" event', function () {
            expect(baseLayerFailedCallback.calls.count()).toEqual(1);
          });
        });
      });
    });

    describe('when the current baseLayer has labels', function () {
      beforeEach(function () {
        collection.reset([
          {
            id: '1',
            kind: 'tiled',
            options: {
              name: 'Positron',
              category: 'CartoDB',
              type: 'Tiled'
            },
            order: 0
          },
          {
            id: '2',
            kind: 'tiled',
            options: {
              type: 'Tiled',
              name: 'Positrong Labels',
              category: 'CartoDB',
              urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
            },
            order: 1
          }
        ]);
      });

      describe("when the new baseLayer doesnt't have labels", function () {
        beforeEach(function () {
          collection.setBaseLayer({
            type: 'Tiled',
            name: 'Dark matter',
            category: 'CartoDB'
          });
        });

        it('should trigger a "changingBaseLayer event', function () {
          expect(changingBaseLayerCallback.calls.count()).toEqual(1);
        });

        it('should save the existing baseLayer', function () {
          expect(Backbone.Model.prototype.save.calls.count()).toEqual(1);
        });

        describe('when the base layer is saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].success({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB'
              }
            });
          });

          it('should update the base layer', function () {
            expect(collection.first().toJSON()).toEqual({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                type: 'Tiled'
              },
              order: 0
            });
          });

          it('should remove the labels layer', function () {
            expect(Backbone.Model.prototype.destroy).toHaveBeenCalled();
          });

          describe('when the labels layer is destroyed', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].success();
            });

            it('should trigger a "baseLayerChanged" event', function () {
              expect(baseLayerChangedCallback.calls.count()).toEqual(1);
            });

            it('should remove the layer from the collection', function () {
              expect(collection.size()).toEqual(1);
            });
          });

          describe('when the labels layer is NOT destroyed', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].error();
            });

            it('should trigger a "baseLayerFailed" event', function () {
              expect(baseLayerFailedCallback.calls.count()).toEqual(1);
            });

            it('should NOT remove the layer from the collection', function () {
              expect(collection.size()).toEqual(2);
            });
          });
        });

        describe('when the base layer is NOT saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].error();
          });

          it('should trigger a "baseLayerFailed" event', function () {
            expect(baseLayerFailedCallback).toHaveBeenCalled();
          });
        });
      });

      describe('when the new baseLayer has labels', function () {
        beforeEach(function () {
          collection.setBaseLayer({
            type: 'Tiled',
            name: 'Dark matter',
            category: 'CartoDB',
            labels: {
              urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
            }
          });
        });

        it('should trigger a "changingBaseLayer event', function () {
          expect(changingBaseLayerCallback.calls.count()).toEqual(1);
        });

        it('should save the existing baseLayer', function () {
          expect(Backbone.Model.prototype.save.calls.count()).toEqual(1);
        });

        describe('when the base layer is saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].success({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                labels: {
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
                }
              }
            });
          });

          it('should update the base layer', function () {
            expect(collection.first().toJSON()).toEqual({
              id: '1',
              kind: 'tiled',
              options: {
                name: 'Dark matter',
                category: 'CartoDB',
                type: 'Tiled',
                labels: {
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
                }
              },
              order: 0
            });
          });

          describe('when the labels layer is saved', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].success({
                kind: 'tiled',
                options: {
                  name: 'Dark matter Labels',
                  category: 'CartoDB',
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
                },
                order: 1
              });
            });

            it('should trigger a "baseLayerChanged" event', function () {
              expect(baseLayerChangedCallback.calls.count()).toEqual(1);
            });

            it('should update the labels layer', function () {
              expect(collection.last().toJSON()).toEqual({
                id: '2',
                kind: 'tiled',
                options: {
                  type: 'Tiled',
                  name: 'Dark matter Labels',
                  category: 'CartoDB',
                  urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
                },
                order: 1
              });
            });
          });

          describe('when the labels layer is NOT saved', function () {
            beforeEach(function () {
              Backbone.sync.calls.argsFor(1)[2].error();
            });

            it('should trigger a "baseLayerFailed" event', function () {
              expect(baseLayerFailedCallback.calls.count()).toEqual(1);
            });
          });
        });

        describe('when the base layer is NOT saved', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].error();
          });

          it('should NOT update the labels layer', function () {
            expect(collection.last().get('urlTemplate')).toEqual('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png');
          });

          it('should trigger a "baseLayerFailed" event', function () {
            expect(baseLayerFailedCallback.calls.count()).toEqual(1);
          });
        });
      });
    });
  });

  describe('.isThereAnyGeometryData', function () {
    beforeEach(function () {
      collection.add({
        id: 'A',
        kind: 'carto',
        options: {
          table_name: 'alice',
          source: 'a1'
        }
      });
      analysisDefinitionNodesCollection.add({
        id: 'b1',
        type: 'buffer',
        params: {
          radius: 3,
          source: {
            id: 'a1',
            type: 'buffer',
            params: {}
          }
        }
      });
    });

    it('should be true if there is a layer with geometry data', function (done) {
      spyOn(QueryGeometryModel.prototype, 'hasValueAsync').and.returnValue(Promise.resolve(true));
      collection.isThereAnyGeometryData()
        .then(function (response) {
          expect(response).toEqual(true);
          done();
        });
    });

    it('should be false if there is no layer with geometry data', function (done) {
      spyOn(QueryGeometryModel.prototype, 'hasValueAsync').and.returnValue(Promise.resolve(false));
      collection.isThereAnyGeometryData()
        .then(function (response) {
          expect(response).toEqual(false);
          done();
        });
    });
  });
});
