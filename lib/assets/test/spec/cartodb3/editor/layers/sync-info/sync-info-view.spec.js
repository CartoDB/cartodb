var SyncInfoView = require('../../../../../../javascripts/cartodb3/editor/layers/sync-info/sync-info-view');
var SyncModel = require('../../../../../../javascripts/cartodb3/data/synchronization-model');
var TableModel = require('../../../../../../javascripts/cartodb3/data/table-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');

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
    console.log('syncModel built!');

    this.tableModel = new TableModel({}, {
      configModel: configModel
    });
    console.log('tableModel built!');

    this.userModel = new UserModel({}, {
      configModel: configModel
    });
    console.log('userModel built!');

    this.view = new SyncInfoView({
      modals: {},
      syncModel: this.syncModel,
      tableModel: this.tableModel,
      userModel: this.userModel
    });
    console.log('syncInfoView built!');    
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