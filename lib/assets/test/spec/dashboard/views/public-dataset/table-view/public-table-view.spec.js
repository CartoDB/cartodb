const $ = require('jquery');
const Backbone = require('backbone');
const PublicCartoTableMetadata = require('dashboard/views/public-dataset/public-carto-table-metadata');
const PublicTableView = require('dashboard/views/public-dataset/public-table-view/public-table-view');
const configModel = require('fixtures/dashboard/config-model.fixture');

/**
 * test for table view
 */
describe('dashboard/views/public-dataset/table-tab/public-table-view', function () {
  let tview, model;

  beforeEach(function () {
    model = new PublicCartoTableMetadata({
      name: 'test',
      schema: [
        ['id', 'integer'],
        ['col1', 'integer'],
        ['col2', 'integer'],
        ['col3', 'integer']
      ]
    }, { configModel });

    tview = new PublicTableView({
      el: $('<table>'),
      dataModel: model.data(),
      model,
      row_header: true,
      configModel
    });

    model.data().reset([
      new Backbone.Model({'id': 1, 'col1': 1, 'col2': 2, 'col3': 3}),
      new Backbone.Model({'id': 2, 'col1': 4, 'col2': 5, 'col3': 6})
    ]);
  });

  it("should show the empty table layout when there's no data", function () {
    model.data().reset();
    expect(tview.$('tfoot').length).toBe(1);
  });

  it('should show the public empty table warning, not the private one', function () {
    model.data().reset();
    model.data().trigger('dataLoaded');
    tview.render();

    expect(tview.$('.placeholder.noRows').length).toBe(0);
    expect(tview.$('.placeholder.noRows.decoration').length).toBe(0);
  });

  it('should not show the empty table layout after an empty row insertion', function () {
    model.data().reset();
    tview.render();
    tview.addEmptyRow();
    expect(tview.$('tfoot').length).toBe(0);
  });
});
