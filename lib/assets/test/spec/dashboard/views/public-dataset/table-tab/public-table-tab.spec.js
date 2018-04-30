const PublicCartoTableMetadata = require('dashboard/views/public-dataset/public-carto-table-metadata');
const PublicTableTab = require('dashboard/views/public-dataset/table-tab/public-table-tab');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/public-dataset/table-tab/public-table-tab', function () {
  let tview, model;

  beforeEach(function () {
    model = new PublicCartoTableMetadata({
      name: 'test'
    }, { configModel });

    tview = new PublicTableTab({
      model,
      configModel
    });
  });

  it('should render a div', function () {
    tview.render();
    expect(tview.$el.hasClass('table')).toBeTruthy();
  });
});
