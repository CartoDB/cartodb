var UserModel = require('builder/data/user-model');
var ConfigModel = require('builder/data/config-model');
var ImportsModel = require('builder/data/background-importer/imports-model');
var BackgroundImportItemView = require('builder/components/background-importer/background-import-item-view');
var FactoryModals = require('../../factories/modals');

describe('editor/components/background-importer/background-import-item', function () {
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
    spyOn(BackgroundImportItemView.prototype, 'updateNotification').and.callThrough();
    spyOn(BackgroundImportItemView.prototype, 'clean').and.callThrough();

    this.importerView = new BackgroundImportItemView({
      modals: FactoryModals.createModalService(),
      createVis: false,
      importModel: this.model,
      userModel: this.userModel,
      configModel: this.configModel
    });

    spyOn(this.importerView, '_getStatus').and.returnValue('success');
  });

  it('should create notification properly', function () {
    expect(this.importerView._notification).toBeDefined();
  });

  it('should bind model changes', function () {
    this.model.set('state', 'failed');
    expect(BackgroundImportItemView.prototype.updateNotification).toHaveBeenCalled();
  });

  it('should stop upload and remove it when upload is aborted', function () {
    this.model.set('state', 'uploading');
    this.importerView._notification.trigger('notification:close');
    expect(BackgroundImportItemView.prototype.clean).toHaveBeenCalled();
  });

  it('should show display_name when it is available from import model', function () {
    this.model._importModel.set({ item_queue_id: 'hello-id', type: '' });
    this.model.set('state', 'importing');
    expect(this.importerView._notification.get('info')).toContain('hello-id');
    this.model._importModel.set('display_name', 'table_name_test');
    this.model.set('state', 'geocoding');
    expect(this.importerView._notification.get('info')).toContain('table_name_test');
    expect(this.importerView._notification.get('info')).not.toContain('hello-id');
  });
});
