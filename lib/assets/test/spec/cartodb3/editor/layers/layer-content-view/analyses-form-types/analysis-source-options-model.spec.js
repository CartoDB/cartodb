var cdb = require('cartodb.js');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var TablesCollection = require('../../../../../../../javascripts/cartodb3/data/tables-collection');
var AnalysisSourceOptionsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/analysis-source-options-model');
var LayerDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/layer-content-views/analyses-form-types/analysis-source-options-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.sqlAPI = new cdb.SQL({
      user: 'pepe'
    });
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: this.sqlAPI,
      configModel: configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    });

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

  describe('when items are fetched', function () {
    beforeEach(function () {
      spyOn(this.tablesCollection, 'fetch');
      spyOn(this.analysisDefinitionNodesCollection.first(), 'asyncGetOutputGeometryType');
      this.model.fetch();
    });

    it('should is fetching', function () {
      expect(this.model.get('fetching')).toBe(true);
    });

    describe('when all items are fetched successfully', function () {
      beforeEach(function () {
        this.tablesCollection.add({
          name: 'test_table',
          geometry_types: ['ST_POINT']
        });
        this.tablesCollection.trigger('sync');
        expect(this.model.get('fetching')).toBe(true);

        this.analysisDefinitionNodesCollection.first().asyncGetOutputGeometryType.calls.argsFor(0)[0](null, 'polygon');
        expect(this.model.get('fetching')).toBe(false);
      });

      it('should not be fetching anymore', function () {
        expect(this.model.get('fetching')).toBe(false);
      });

      it('should have items matching geometry type', function () {
        expect(this.model.getSelectOptions('polygon')).toEqual([
          jasmine.objectContaining({
            val: 'a0',
            label: 'a0 (foo)'
          })
        ]);

        expect(this.model.getSelectOptions('point')).toEqual([
          jasmine.objectContaining({
            val: 'test_table',
            label: 'test_table'
          })
        ]);
      });
    });
  });
});
