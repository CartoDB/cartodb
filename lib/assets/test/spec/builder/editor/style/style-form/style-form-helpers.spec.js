var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
var StyleFormHelpers = require('builder/editor/style/style-form/style-form-helpers');
var StyleConstants = require('builder/components/form-components/_constants/_style');

describe('editor/style/style-form/style-form-helpers', function () {
  var TEST_COLUMNS = [
    { name: 'cartodb_id', type: 'number' },
    { name: 'a_number', type: 'number' },
    { name: 'description', type: 'string' }
  ];

  var CARTODB_ID = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
  var A_NUMBER_COLUMN = { val: 'a_number', label: 'a_number', type: 'number' };
  var A_TEXT_COLUMN = { val: 'description', label: 'description', type: 'string' };
  var ALL_COLUMNS = [CARTODB_ID, A_NUMBER_COLUMN, A_TEXT_COLUMN];

  var AGG_VALUE = { val: 'agg_value', label: 'agg_value', type: 'number' };
  var AGG_VALUE_DENSITY = { val: 'agg_value_density', label: 'agg_value_density', type: 'number' };

  it('should help to get schema columns with and without filters', function () {
    var querySchemaModel = getQuerySchemaModelFixture();
    querySchemaModel.columnsCollection.reset(TEST_COLUMNS);

    // SUT no filter
    var schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, null);
    expect(schemaColumns).toEqual(ALL_COLUMNS);

    // filter just Number
    var filterJustNumberCols = function (item) { return item.get('type') === 'number'; };
    schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, filterJustNumberCols);
    expect(schemaColumns).toEqual([CARTODB_ID, A_NUMBER_COLUMN]);
  });

  it('should help to get correct options (columns) for a style type', function () {
    var querySchemaModel = getQuerySchemaModelFixture();
    querySchemaModel.columnsCollection.reset(TEST_COLUMNS);

    var params = {
      querySchemaModel: querySchemaModel,
      filter: null,
      styleType: StyleConstants.Type.SIMPLE
    };

    // SimpleMode
    var options = StyleFormHelpers.getOptionsByStyleType(params);
    expect(options).toEqual(ALL_COLUMNS);

    // Aggregations may change the options available
    var someAggregations = [StyleConstants.Type.HEATMAP, StyleConstants.Type.HEXABINS,
      StyleConstants.Type.SQUARES, StyleConstants.Type.REGIONS];
    someAggregations.forEach(function (aggregationMode) {
      params.styleType = aggregationMode;
      options = StyleFormHelpers.getOptionsByStyleType(params);
      expect(options).not.toEqual(ALL_COLUMNS);

      // an example...
      if (aggregationMode === StyleConstants.Type.REGIONS) {
        expect(options).toEqual([AGG_VALUE, AGG_VALUE_DENSITY]);
      }
    });
  });

  it('should help to generate a select with schema options', function () {
    var querySchemaModel = getQuerySchemaModelFixture();
    querySchemaModel.columnsCollection.reset(TEST_COLUMNS);

    var componentName = 'animated-attribute';
    var editor = StyleFormHelpers.generateSelectWithSchemaColumns(componentName, querySchemaModel, null);

    expect(editor).toEqual(jasmine.objectContaining({
      type: 'Select',
      options: ALL_COLUMNS
    }));

    expect(editor.title).toContain(componentName);
  });
});
