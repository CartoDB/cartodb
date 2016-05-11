var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var _ = require('underscore-cdb-v3');
var DataFormView = require('../../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/data_import/data_form_view');
var UploadModel = require('../../../../../../../../../javascripts/cartodb/common/background_polling/models/upload_model');


describe('common/dialogs/create/imports/data_import/data_form_view', function() {

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

    this.view = new DataFormView({
      model: this.model,
      user: this.user,
      fileEnabled: true
    });

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.Form').length).toBe(1);
    expect(this.view.$('.Form-row').length).toBe(1);
    expect(this.view.$('.Form-upload').length).toBe(1);
    expect(this.view.$('.js-dropzone').length).toBe(1);
  });

  it('should not render file part if option is disabled', function() {
    this.view.options.fileEnabled = false;
    this.view.render();
    expect(this.view.$('.Form-row').length).toBe(1);
    expect(this.view.$('.js-dropzone').length).toBe(0);
  });

  it('should have change state binding', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:state');
  });

  it("should be hidden when state is selected", function() {
    spyOn(this.view, 'hide');
    spyOn(this.view, 'show');
    this.model.set({
      state: 'selected',
      type: 'url',
      value: 'http://cartodb'
    });
    expect(this.view.hide).toHaveBeenCalled();
    this.model.set('state', 'error');
    expect(this.view.show).toHaveBeenCalled();
  });

  it("should submit url when it is valid", function() {
    var urlSelectedSent = false;
    this.view.bind('urlSelected', function() {
      urlSelectedSent = true;
    });

    this.view.$('.js-textInput')
      .val('https://cartodb.com')
      .trigger('keyup');
    this.view.$('.js-form').submit();

    expect(urlSelectedSent).toBeTruthy();
    expect(this.model.get('state')).toBe('selected');
  });

  it("shouldn't change type attribute when a url is submitted and is valid", function() {
    this.model.set({
      type: 'service',
      service_name: 'arcgis'
    });
    this.view.render();
    this.view.$('.js-textInput')
      .val('https://cartodb.com')
      .trigger('keyup');
    this.view.$('.js-form').submit();
    expect(this.model.get('type')).toBe('service');
  });

  it("should show error when url is invalid", function() {
    spyOn(this.view, '_showTextError');
    this.view.$('.js-textInput')
      .val('fake-url')
      .trigger('keyup');

    this.view.$('.js-form').submit();
    expect(this.view._showTextError).toHaveBeenCalled();
  });

  it("should set selected state when file is selected", function() {
    spyOn(this.view, '_showFileError');
    this.view._onFileChanged([{ name: 'filename.csv' }]);
    expect(this.model.get('state')).toBe('selected');
    expect(this.view._showFileError).not.toHaveBeenCalled();
  });

  it("should show file error when the selected one is not valid", function() {
    spyOn(this.view, '_showFileError');
    this.view._onFileChanged([{ name: 'p' }]);
    expect(this.model.get('state')).not.toBe('selected');
    expect(this.view._showFileError).toHaveBeenCalled();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});
