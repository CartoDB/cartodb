const TableDataCollection = require('dashboard/data/table/table-data-collection');

describe('dashboard/data/table/table-data-collection', function () {
  let cols;

  beforeEach(function () {
    cols = new TableDataCollection();

    cols.reset([
      {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3},
      {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6}
    ]);
  });

  it('should return the value for cell', function () {
    expect(cols.getCell(0, 'col1')).toEqual(1);
  });

  it('should return null for non existing cell', function () {
    expect(cols.getCell(10, 'col1')).toEqual(null);
  });
});
