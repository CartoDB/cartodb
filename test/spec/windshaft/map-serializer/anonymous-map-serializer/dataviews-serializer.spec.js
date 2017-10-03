var Backbone = require('backbone');
var CategoryDataviewModel = require('../../../../../src/dataviews/category-dataview-model');
var HistogramDataviewModel = require('../../../../../src/dataviews/histogram-dataview-model');
var FormulaDataviewModel = require('../../../../../src/dataviews/formula-dataview-model');
var fakeFactory = require('../../../../helpers/fakeFactory');
var DataviewsSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/dataviews-serializer');

describe('dataviews-serializer', function () {
  describe('.serialize', function () {
    var vis;
    var map;
    var layer;
    var analysis;

    beforeEach(function () {
      vis = new Backbone.Model();
      map = new Backbone.Model();
      layer = new Backbone.Model();
      analysis = fakeFactory.createAnalysisModel({ id: 'a0' });
    });

    it('serialises histogram dataviews', function () {
      var histogramDataview = new HistogramDataviewModel({
        id: 'dataview1',
        column: 'column1',
        column_type: 'date',
        aggregation: 'week',
        source: analysis
      }, {
        map: map,
        vis: vis,
        layer: layer
      });

      var dataviewsCollection = new Backbone.Collection([
        histogramDataview
      ]);

      expect(DataviewsSerializer.serialize(dataviewsCollection)).toEqual({
        dataview1: {
          type: 'histogram',
          source: {
            id: 'a0'
          },
          options: {
            column: 'column1',
            aggregation: 'week'
          }
        }
      });
    });

    it('serialises category dataviews', function () {
      var categoryDataview = new CategoryDataviewModel({
        id: 'dataview2',
        column: 'column2',
        aggregation: 'aggregation2',
        aggregation_column: 'aggregation_column2',
        source: analysis
      }, {
        map: map,
        vis: vis,
        layer: layer
      });

      var dataviewsCollection = new Backbone.Collection([
        categoryDataview
      ]);

      expect(DataviewsSerializer.serialize(dataviewsCollection)).toEqual({
        dataview2: {
          type: 'aggregation',
          source: {
            id: 'a0'
          },
          options: {
            column: 'column2',
            aggregation: 'aggregation2',
            aggregationColumn: 'aggregation_column2'
          }
        }
      });
    });

    it('serialises formula dataviews', function () {
      var formulaDataview = new FormulaDataviewModel({
        id: 'dataview3',
        column: 'column3',
        operation: 'sum',
        source: analysis
      }, {
        map: map,
        vis: vis,
        layer: layer
      });

      var dataviewsCollection = new Backbone.Collection([
        formulaDataview
      ]);

      expect(DataviewsSerializer.serialize(dataviewsCollection)).toEqual({
        dataview3: {
          type: 'formula',
          source: {
            id: 'a0'
          },
          options: {
            column: 'column3',
            operation: 'sum'
          }
        }
      });
    });
  });
});
