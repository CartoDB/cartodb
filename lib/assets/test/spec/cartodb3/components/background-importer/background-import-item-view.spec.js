var ImportsModel = require('../../../../../javascripts/cartodb3/data/background-importer/imports-model.js');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var BackgroundImportItemView = require('../../../../../javascripts/cartodb3/components/background-importer/background-import-item-view.js');

describe('common/background-polling/background-import-item-view', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: this.configModel
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new BackgroundImportItemView({
      modals: {},
      createVis: false,
      model: this.model,
      userModel: this.userModel,
      configModel: this.configModel
    });
  });

  it('should render properly', function () {
    this.view.render();
    expect(this.view.$el.hasClass('ImportItem')).toBeTruthy();
    expect(this.view.$('.ImportItem-text').length).toBe(1);
  });

  it('should bind model changes', function () {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('remove');
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
});
