const ImportsModel = require('builder/data/background-importer/imports-model');
const BackgroundImportItemView = require('dashboard/views/dashboard/imports/background-import-item/background-import-item-view');
const userFixture = require('fixtures/dashboard/user-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/dashboard/imports/background-import-item/background-import-item-view', function () {
  beforeEach(function () {
    var user = userFixture({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });
    this.model = new ImportsModel({}, {
      userModel: user,
      configModel
    });

    spyOn(BackgroundImportItemView.prototype, 'listenTo').and.callThrough();

    this.view = new BackgroundImportItemView({
      createVis: false,
      model: this.model,
      userModel: user,
      configModel,
      showSuccessDetailsButton: true
    });
  });

  it('should render properly', function () {
    this.view.render();
    expect(this.view.$el.hasClass('ImportItem')).toBeTruthy();
    expect(this.view.$('.ImportItem-text').length).toBe(1);
  });

  it('should bind model changes', function () {
    expect(this.view.listenTo.calls.argsFor(0)[1]).toEqual('change');
    expect(this.view.listenTo.calls.argsFor(1)[1]).toEqual('remove');
  });

  it('should stop upload and remove it when upload is aborted', function () {
    this.view.render();
    spyOn(this.view, 'clean');
    this.model.set('state', 'uploading');
    this.view.$('.js-abort').click();
    expect(this.view.clean).toHaveBeenCalled();
  });

  it('should show display_name when it is available from import model', function () {
    this.model._importModel.set({ item_queue_id: 'hello-id', type: '' });
    this.model.set('state', 'importing');
    expect(this.view.$('.ImportItem-text').text()).toContain('hello-id');
    this.model._importModel.set('display_name', 'table_name_test');
    this.model.set('state', 'geocoding');
    expect(this.view.$('.ImportItem-text').text()).toContain('table_name_test');
    expect(this.view.$('.ImportItem-text').text()).not.toContain('hello-id');
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
