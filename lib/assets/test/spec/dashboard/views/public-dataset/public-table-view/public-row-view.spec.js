const $ = require('jquery');
const PublicTableView = require('dashboard/views/public-dataset/public-table-view/public-table-view');
const PublicRowView = require('dashboard/views/public-dataset/public-table-view/public-row-view');
const PublicCartoTableMetadata = require('dashboard/views/public-dataset/public-carto-table-metadata');
const RowModel = require('dashboard/data/table/row-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/public-dataset/public-table-view/public-row-view', function () {
  var tableview, view, model;

  beforeEach(function () {
    model = new PublicCartoTableMetadata({
      name: 'test',
      schema: [['cartodb_id', 'number'], ['test', 'string'], ['test2', 'number'], ['the_geom', 'geometry']],
      geometry_types: ['ST_MultiPoint']
    }, { configModel });

    view = new PublicRowView({
      el: $('<div>'),
      model: new RowModel({
        cartodb_id: 1,
        test: 'test',
        test2: 1,
        the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }'
      }, { configModel }),
      row_header: true
    });

    tableview = new PublicTableView({
      model: model,
      dataModel: model.data(),
      configModel
    });

    view.tableView = tableview;
  });

  it('should render properly', function () {
    view.render();
    expect(view.$('td').length).toBe(5);

    expect(view.$('td:eq(0) div.cell').text()).toBe('');
    expect(view.$('td:eq(1) div.cell').text()).toBe('1');
    expect(view.$('td:eq(2) div.cell').text()).toBe('test');
    expect(view.$('td:eq(3) div.cell').text()).toBe('1');
    expect(view.$('td:eq(4) div.cell').text()).toBe('GeoJSON');
  });

  it('should not open row menu on click', function () {
    view.render();
    view.$('.row_header').trigger('click');
    expect(view._getRowOptions()).toBeFalsy();
  });
});
