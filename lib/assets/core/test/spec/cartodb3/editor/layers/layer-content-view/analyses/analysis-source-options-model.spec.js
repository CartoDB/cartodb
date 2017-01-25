var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var Backbone = require('backbone');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var TablesCollection = require('../../../../../../../javascripts/cartodb3/data/tables-collection');
var TableModel = require('../../../../../../../javascripts/cartodb3/data/table-model');
var AnalysisSourceOptionsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');

describe('cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    spyOn(TableModel.prototype, 'fetch');

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
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
      name: 'table_layer',
      source: 'a0',
      color: '#000'
    });
    layerModel.getName = function () { return this.get('name'); };
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
