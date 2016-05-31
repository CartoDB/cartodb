var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var geometry = require('../../../../../../../javascripts/cartodb3/value-objects/geometry');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var TablesCollection = require('../../../../../../../javascripts/cartodb3/data/tables-collection');
var AnalysisSourceOptionsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var LayerDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/layer-content-views/analyses/analysis-source-options-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
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

  describe('when analysis nodes are fetched', function () {
    beforeEach(function () {
      spyOn(this.tablesCollection, 'fetch');
      spyOn(this.analysisDefinitionNodesCollection.first().querySchemaModel, 'fetch');
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

        spyOn(this.analysisDefinitionNodesCollection.first().querySchemaModel, 'getGeometry').and.returnValue(geometry('0106000020E61000000100000001030000000100000016000000000000C0D4211740000000A07DC34840000000C0285C1740000000E0AEC6484000000000BF98174000000060D5D44840000000A03F48174000000020E4DF48400000000096FC164000000060CBE54840000000C06903174000000000B1EC484000000060A8EC16400000008073F2484000000060BB3B17400000006005FB48400000000065471740000000203E0149400000002085EB1740000000000B16494000000080826D1840000000207915494000000040FF861840000000601110494000000040138F18400000004092FF484000000080814E1940000000A07BEB484000000060C1161A4000000020D2E74840000000E0CE0A1A40000000A06ADA484000000060707D1940000000A08DCB484000000000EA721940000000A0E0BA4840000000603EA91840000000609AC0484000000000F1EC17400000008062B948400000000074DA17400000004081BE4840000000C0D4211740000000A07DC34840'));
        this.analysisDefinitionNodesCollection.first().querySchemaModel.set('status', 'fetched');
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
