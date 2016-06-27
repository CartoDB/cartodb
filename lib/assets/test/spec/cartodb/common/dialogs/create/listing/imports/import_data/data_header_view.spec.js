var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var DataHeaderView = require('../../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/data_import/data_header_view');
var UploadModel = require('../../../../../../../../../javascripts/cartodb/common/background_polling/models/upload_model');


describe('common/dialogs/create/imports/data_import/data_header_view', function() {

  beforeEach(function() {
    
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.cartodb.com'
    });

    this.model = new UploadModel({
      type: 'url',
      service_name: ''
    }, {
      user: this.user
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new DataHeaderView({
      model: this.model,
      user: this.user,
      fileEnabled: true,
      acceptSync: true
    });

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.ImportPanel-headerTitle').length).toBe(1);
    expect(this.view.$('.ImportPanel-headerDescription').length).toBe(1);
    expect(this.view.$('.ImportPanel-headerButton').length).toBe(0);
  });

  it('should have change state binding', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:state');
  });

  it("should show 'go back' button when import is selected", function() {
    this.model.set({
      state: 'selected',
      type: 'url',
      value: 'https://cartodb.com'
    });
    expect(this.view.$('.ImportPanel-headerButton').length).toBe(1);
    this.view.$('.ImportPanel-headerButton').click();
    expect(this.model.get('state')).toBe('idle');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});