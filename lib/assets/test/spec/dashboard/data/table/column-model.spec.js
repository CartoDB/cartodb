const ColumnModel = require('dashboard/data/table/column-model');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/table/column-model', function () {
  let column;

  beforeEach(function () {
    const table = new CartoTableMetadata({
      id: 'testTable',
      name: 'testTable'
    }, { configModel });

    column = new ColumnModel({
      table,
      name: 'columnName',
      configModel
    });
  });

  it('should have correct url', function () {
    expect(column.url()).toEqual(
      '/api/v1/tables/testTable/columns/columnName'
    );
  });
});
