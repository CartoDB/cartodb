var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var TablesCollection = require('builder/data/tables-collection');
var TableModel = require('builder/data/table-model');
var AnalysisSourceOptionsModel = require('builder/editor/layers/layer-content-views/analyses/analysis-source-options-model');

describe('builder/editor/layers/layer-content-views/analyses/analysis-source-options-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    spyOn(TableModel.prototype, 'fetch');

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {}
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      params: {
        table_name: 'hello',
        query: 'SELECT * FROM first'
      }
    });

    var layerModel = new Backbone.Model({
      name: 'Layer Name',
      table_name: 'table_name',
      source: 'a0',
      color: '#000'
    });
    layerModel.getName = function () { return this.get('name'); };
    layerModel.getTableName = function () { return this.get('table_name'); };
    this.layerDefinitionsCollection = new Backbone.Collection(layerModel);
    this.layerDefinitionsCollection.findOwnerOfAnalysisNode = function (node) {
      return layerModel;
    };

    this.tablesCollection = new TablesCollection(null, {
      configModel: configModel
    });

    this.model = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      tablesCollection: this.tablesCollection
    });
  });

  it('should not have any select options just yet', function () {
    expect(this.model.getSelectOptions('point')).toEqual([]);
    expect(this.model.getSelectOptions('polygon')).toEqual([]);
  });

  describe('when analysis are fetching but there are nodes', function () {
    beforeEach(function () {
      var nodes = [{
        label: 'a0',
        simpleGeometryType: 'polygon',
        val: 'a0'
      }];

      this.model.set({
        nodes_options: nodes,
        fetching: true
      });
    });

    it('should populate nodes from already fetched nodes', function () {
      expect(this.model.getSelectOptions('polygon')).toEqual([
        jasmine.objectContaining({
          val: 'a0',
          label: 'a0',
          type: 'node'
        })
      ]);
    });
  });

  describe('when analysis are already fetched', function () {
    beforeEach(function () {
      spyOn(this.tablesCollection, 'fetch');
      spyOn(this.analysisDefinitionNodesCollection.first().queryGeometryModel, 'fetch');
      this.analysisDefinitionNodesCollection.first().queryGeometryModel.set({
        simple_geom: 'polygon',
        status: 'fetched'
      });

      this.model.fetch();

      this.tablesCollection.trigger('sync');
      expect(this.model.get('fetching')).toBe(false);
    });

    it('should populate nodes from already fetched nodes', function () {
      expect(this.model.getSelectOptions('polygon')).toEqual([
        jasmine.objectContaining({
          val: 'a0',
          label: 'a0',
          type: 'node'
        })
      ]);
    });
  });

  describe('when analysis nodes are fetched', function () {
    beforeEach(function () {
      spyOn(this.tablesCollection, 'fetch');
      spyOn(this.analysisDefinitionNodesCollection.first().queryGeometryModel, 'fetch');
      this.model.fetch();
    });

    it('should fetch tables reducing the data to be retrieved', function () {
      expect(this.tablesCollection.fetch.calls.first().args).toContain(
        {
          data: Object({
            show_likes: false,
            show_liked: false,
            show_stats: false,
            show_table_size_and_row_count: false,
            show_permission: false,
            show_synchronization: false,
            show_uses_builder_features: false,
            load_totals: false,
            per_page: 1000
          })
        }
      );
    });

    it('should be in fetching state', function () {
      expect(this.model.get('fetching')).toBe(true);
    });

    describe('when all items are fetched successfully', function () {
      beforeEach(function () {
        this.tablesCollection.add({
          name: 'table_with_points',
          geometry_types: ['ST_POINT']
        });
        this.tablesCollection.trigger('sync');
        expect(this.model.get('fetching')).toBe(true);

        this.analysisDefinitionNodesCollection.first().queryGeometryModel.set({
          simple_geom: 'polygon',
          status: 'fetched'
        });
      });

      it('should not be fetching anymore', function () {
        expect(this.model.get('fetching')).toBe(false);
      });

      it('should have items matching geometry type', function () {
        expect(this.model.getSelectOptions('polygon')).toEqual([
          jasmine.objectContaining({
            val: 'a0',
            label: 'a0',
            type: 'node'
          })
        ]);

        expect(this.model.getSelectOptions('point')).toEqual([
          jasmine.objectContaining({
            val: 'table_with_points',
            label: 'table_with_points',
            type: 'dataset'
          })
        ]);
      });

      it('should have items matching multiple accepted geometries', function () {
        expect(this.model.getSelectOptions(['polygon', 'point'])).toEqual([
          jasmine.objectContaining({
            val: 'a0',
            label: 'a0',
            type: 'node'
          }),
          jasmine.objectContaining({
            val: 'table_with_points',
            label: 'table_with_points',
            type: 'dataset'
          })
        ]);
      });

      it('should have items matching a wildcard geometry', function () {
        expect(this.model.getSelectOptions(['*'])).toEqual([
          jasmine.objectContaining({
            val: 'a0',
            label: 'a0',
            type: 'node'
          }),
          jasmine.objectContaining({
            val: 'table_with_points',
            label: 'table_with_points',
            type: 'dataset'
          })
        ]);
      });
    });
  });
});
