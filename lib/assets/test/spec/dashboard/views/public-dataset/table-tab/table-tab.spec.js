const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const TableTab = require('dashboard/views/public-dataset/table-tab/table-tab');
const VisualizationModel = require('dashboard/data/visualization-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

// This test is not passable, because Geocoding feature is not migrated

xdescribe('TableTab', function () {
  let tview, model;

  beforeEach(function () {
    model = new CartoTableMetadata({
      name: 'test',
      configModel
    });

    tview = new TableTab({
      model: model,
      // geocoder: new cdb.admin.Geocoding(),
      vis: new VisualizationModel({}, { configModel })
    });
  });

  it('should render a div', function () {
    tview.render();
    expect(tview.$el.hasClass('table')).toBeTruthy();
  });

  it('should have a geocoding binding from the begining', function () {
    tview.render();
    spyOn(tview.model.data(), 'refresh');
    tview.geocoder.trigger('geocodingComplete');
    expect(tview.model.data().refresh).toHaveBeenCalled();
  });
});
