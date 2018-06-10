// var Backbone = require('backbone');
var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
// var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

// var StyleModel = require('builder/editor/style/style-definition-model.js');
// var QueryColumnsCollection = require('builder/data/query-columns-collection');

var StyleFormHelpers = require('builder/editor/style/style-form/style-form-helpers');

describe('editor/style/style-form/style-form-helpers', function () {
  it('should help to get schema columns with and without filters', function () {
    var querySchemaModel = getQuerySchemaModelFixture();
    querySchemaModel.columnsCollection.reset([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'a_number',
        type: 'number'
      }, {
        name: 'description',
        type: 'string'
      }
    ]);

    var cartodb_id = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
    var a_number = { val: 'a_number', label: 'a_number', type: 'number' };
    var description = { val: 'description', label: 'description', type: 'string' };

    // SUT no filter
    var schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, null);
    expect(schemaColumns).toEqual([cartodb_id, a_number, description]);

    // filter number
    var filterJustNumberCols = function (item) { return item.get('type') === 'number'; };
    schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, filterJustNumberCols);
    expect(schemaColumns).toEqual([cartodb_id, a_number]);
  });

  it('should help to get correct options (columns) for a style type', function () {
    var querySchemaModel = getQuerySchemaModelFixture();
    querySchemaModel.columnsCollection.reset([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'a_number',
        type: 'number'
      }, {
        name: 'description',
        type: 'string'
      }
    ]);

    var cartodb_id = { val: 'cartodb_id', label: 'cartodb_id', type: 'number' };
    var a_number = { val: 'a_number', label: 'a_number', type: 'number' };
    var description = { val: 'description', label: 'description', type: 'string' };

    // SUT no filter
    var schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, null);
    expect(schemaColumns).toEqual([cartodb_id, a_number, description]);

    // filter number
    var filterJustNumberCols = function (item) { return item.get('type') === 'number'; };
    schemaColumns = StyleFormHelpers.getSchemaColumns(querySchemaModel, filterJustNumberCols);
    expect(schemaColumns).toEqual([cartodb_id, a_number]);
  });
});
