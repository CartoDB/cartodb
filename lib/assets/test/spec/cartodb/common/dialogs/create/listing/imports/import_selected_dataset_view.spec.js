var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var SelectedView = require('../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/import_selected_dataset_view');
var UploadModel = require('../../../../../../../../javascripts/cartodb/common/background_polling/models/upload_model');


describe('common/dialogs/create/imports/import_selected_dataset_view', function() {

  beforeEach(function() {
    cdb.config.set('cartodb_com_hosted', false);
    
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.cartodb.com',
      actions: {
        sync_tables: true
      }
    });

    window.upgrade_url = 'http://localhost:3000/account/development/upgrade';

    this.model = new UploadModel({
      type: 'url',
      value: 'https://cartodb.com'
    }, {
      user: this.user
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new SelectedView({
      model: this.model,
      user: this.user,
      acceptSync: true,
      fileAttrs: {}
    });

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.DatasetSelected-item').length).toBe(1);
    expect(this.view.$('.DatasetSelected-sync').length).toBe(1);
    expect(this.view.$('.DatasetSelected-upgrade').length).toBe(0);
  });

  it('should have several bindings', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:value');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('change:interval');
    expect(this.model.bind.calls.argsFor(2)[0]).toEqual('change:state');
  });

  it('should be able to change view options with a public method', function() {
    expect(this.view.setOptions).not.toBeUndefined();
  });

  it('should change item interval when any sync "radiobutton" is clicked', function() {
    expect(this.model.get('interval')).toBe(0);
    this.view.$('.js-interval-4').click();
    expect(this.model.get('interval')).toBe(2592000);
  });

  it('should hide sync block if option is disabled', function() {
    this.view.options.acceptSync = false;
    this.view.render();
    expect(this.view.$('.DatasetSelected-sync').length).toBe(0);
  });

  it('show show upgrade block if user is upgradeable', function() {
    this.user.set('actions', { sync_tables: false });
    this.view.render();
    expect(this.view.$('.DatasetSelected-upgrade').length).toBe(1);
    expect(this.view.$('.RadioButton.is-disabled').length).toBe(4);
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
    window.upgrade_url = undefined;
    delete window.upgrade_url;
  });

});