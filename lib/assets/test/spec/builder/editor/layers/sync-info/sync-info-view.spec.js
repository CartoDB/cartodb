var SyncInfoView = require('builder/editor/layers/sync-info/sync-info-view');
var SyncModel = require('builder/data/synchronization-model');
var TableModel = require('builder/data/table-model');
var UserModel = require('builder/data/user-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/sync-info/sync-info-view', function () {
  beforeEach(function () {
    var configModel = {};

    this.syncModel = new SyncModel({
      run_at: new Date('2016-03-25'),
      ran_at: new Date('2016-03-26'),
      from_external_source: true,
      state: 'yep',
      error_code: '',
      error_message: ''
    }, {
      configModel: configModel
    });

    this.tableModel = new TableModel({}, {
      configModel: configModel
    });

    this.userModel = new UserModel({}, {
      configModel: configModel
    });

    this.visDefinitionModel = new VisDefinitionModel({}, {
      configModel: configModel
    });

    this.view = new SyncInfoView({
      modals: FactoryModals.createModalService(),
      syncModel: this.syncModel,
      tableModel: this.tableModel,
      userModel: this.userModel,
      visDefinitionModel: this.visDefinitionModel
    });
  });

  describe('.render', function () {
    it('should hide options if the user is not the owner', function () {
      spyOn(this.tableModel, 'isOwner').and.returnValue(false);

      this.view.render();

      expect(this.tableModel.isOwner.calls.argsFor(0)[0].cid).toEqual(this.userModel.cid);
      expect(this.view.$('.js-options').length).toBe(0);
    });

    it('should show options if the user is the owner', function () {
      spyOn(this.tableModel, 'isOwner').and.returnValue(true);

      this.view.render();

      expect(this.tableModel.isOwner.calls.argsFor(0)[0].cid).toEqual(this.userModel.cid);
      expect(this.view.$('.js-options').length).toBe(1);
    });
  });
});
