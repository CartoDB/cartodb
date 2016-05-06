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

  it('should show confirmation', function () {
    view.render();

    expect(view.$el.find('.Button--main').text()).toContain('Ok, export');
  });

  it('should show pending state loading window', function () {
    view.model.set('state', 'pending');
    view.render();

    expect(view.$el.find('.IntermediateInfo-title').text()).toContain('Pending ...');
  });

  it('should show exporting state loading window', function () {
    view.model.set('state', 'exporting');
    view.render();

    expect(view.$el.find('.IntermediateInfo-title').text()).toContain('Exporting ...');
  });

  it('should show uploading state loading window', function () {
    view.model.set('state', 'uploading');
    view.render();

    expect(view.$el.find('.IntermediateInfo-title').text()).toContain('Uploading ...');
  });
});
