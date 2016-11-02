/* global cdb */
var ExportMapView = require('../../../../../../javascripts/cartodb/common/dialogs/export_map/export_map_view');

// Just duplicated from old modal to maintain the exiting tests at least.
describe('common/dialogs/export/export_view', function () {
  var view;
  beforeEach(function () {
    view = new ExportMapView({
      model: new cdb.admin.ExportMapModel({ visualization_id: 'abcd-1234' }),
      clean_on_hide: true,
      enter_to_confirm: true
    });
  });

  it('should show confirmation for public datasets', function () {
    view.render();

    expect(view.$('.js-ok').text()).toContain('Ok, export');
    expect(view.$('.Dialog-headerIcon').hasClass('Dialog-headerIcon--neutral')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').hasClass('u-secondaryTextColor')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').text())
      .toContain('Export map');
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-medium').text())
      .toContain('This map, and the connected data, will be exported as a .carto file.');
  });

  it('should show private datasets warning while being owners', function () {
    // Create view with a model with the proper flags
    view = new ExportMapView({
      model: new cdb.admin.ExportMapModel({
        visualization_id: 'abcd-1234',
        private_datasets: true,
        owning_private_datasets: true
      }),
      clean_on_hide: true,
      enter_to_confirm: true
    });
    view.render();

    expect(view.$('.Dialog-headerIcon').hasClass('Dialog-headerIcon--alert')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').hasClass('u-alertTextColor')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').text())
      .toContain("You're about to export a map with Private Datasets");
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-medium').text())
      .toContain("Private Dataset will be exported. Be careful when sharing it, your whole data is there.");
  });

  it('should show private datasets warning while not owning any', function () {
    // Create view with a model with the proper flags
    view = new ExportMapView({
      model: new cdb.admin.ExportMapModel({
        visualization_id: 'abcd-1234',
        private_datasets: true,
        owning_private_datasets: false
      }),
      clean_on_hide: true,
      enter_to_confirm: true
    });    
    view.render();

    expect(view.$('.Dialog-headerIcon').hasClass('Dialog-headerIcon--alert')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').hasClass('u-alertTextColor')).toBeTruthy();
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-large').text())
      .toContain("You're about to export a map with Private Datasets");
    expect(view.$('.Dialog-header > p.CDB-Text.CDB-Size-medium').text())
      .toContain("This map contents one or more Private Dataset. Only public datasets will be exported.");
  });

  it('should show pending state loading window', function () {
    view.model.set('state', 'pending');
    view.render();

    expect(view.$('.CDB-Text').text()).toContain('Pending ...');
  });

  it('should show exporting state loading window', function () {
    view.model.set('state', 'exporting');
    view.render();

    expect(view.$('.CDB-Text').text()).toContain('Exporting ...');
  });

  it('should show uploading state loading window', function () {
    view.model.set('state', 'uploading');
    view.render();

    expect(view.$('.CDB-Text').text()).toContain('Uploading ...');
  });
});
